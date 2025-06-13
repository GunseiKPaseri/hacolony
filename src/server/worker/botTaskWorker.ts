import { inject, injectable } from "tsyringe";
import type { Logger } from "pino";
import type { BotTaskQueue } from "@/generated/client";
import type {
  BotTaskQueueRepository,
  LlmTaskQueueRepository,
  BotConfigRepository,
  PostRepository,
} from "../repository/interface";
import { DI } from "../di.type";
import { QueueStatusManager } from "./queueStatusManager";

@injectable()
export class BotTaskWorker {
  constructor(
    @inject(DI.Logger) private readonly logger: Logger,
    @inject(DI.BotConfigRepository) private readonly botConfigRepo: BotConfigRepository,
    @inject(DI.BotTaskQueueRepository) private readonly botTaskQueueRepo: BotTaskQueueRepository,
    @inject(DI.LlmTaskQueueRepository) private readonly llmTaskQueueRepo: LlmTaskQueueRepository,
    @inject(DI.PostRepository) private readonly postRepo: PostRepository,
  ) {}

  async processTasks(): Promise<void> {
    try {
      // 現在処理中のタスク数を取得して、適切な取得数を決定
      const processingCount = await this.botTaskQueueRepo.getProcessingCount();
      const maxConcurrent = 5; // 最大同時処理数
      const availableSlots = Math.max(0, maxConcurrent - processingCount);

      if (availableSlots === 0) {
        this.logger.debug({ processingCount, maxConcurrent }, "All slots occupied, skipping bot task processing");
        return;
      }

      // Get pending bot tasks that are QUEUE_WAITING or newly created
      const tasks = await this.botTaskQueueRepo.getPendingTasks(availableSlots);

      if (tasks.length === 0) {
        return;
      }

      this.logger.info(
        {
          taskCount: tasks.length,
          processingCount,
          availableSlots,
        },
        "Processing bot tasks concurrently",
      );

      // 並行処理でタスクを実行
      const taskPromises = tasks.map((task) => this.processTask(task));
      await Promise.allSettled(taskPromises);
    } catch (error) {
      this.logger.error(
        { error: error instanceof Error ? error.message : "Unknown error" },
        "Error processing bot tasks",
      );
    }
  }

  private async processTask(task: BotTaskQueue): Promise<void> {
    try {
      // 現在のコンテキストを確認
      const currentContext = task.task as PrismaJson.TaskContext;

      // タスクキュー待ち状態のみ処理
      // 未設定、CREATED、POST_QUEUEDの場合に処理を継続
      if (currentContext.status && currentContext.status !== "CREATED" && currentContext.status !== "POST_QUEUED") {
        return; // 外部処理待機状態のタスクはスキップ
      }

      // POST_QUEUEDの場合は、POST処理から戻ってきたタスクの再処理を行う
      if (currentContext.status === "POST_QUEUED") {
        // PostQueueの結果を確認して次のアクションを決定
        this.logger.info({ taskId: task.id, avatarId: task.avatarId }, "Resuming bot task after post queue processing");
        // この場合、通常は完了として処理するが、必要に応じて追加処理を行う
        return;
      }

      // Mark task as processing (overall queue status)
      await this.botTaskQueueRepo.updateTaskStatus(task.id, "PROCESSING");

      // Update TaskContext to CREATED status if not set
      let createdTaskContext: PrismaJson.TaskContext;
      if (currentContext.type === "random_post") {
        createdTaskContext = {
          type: "random_post",
          status: "CREATED",
        };
      } else {
        createdTaskContext = {
          type: "reply_post",
          replyToPostId: currentContext.replyToPostId,
          status: "CREATED",
        };
      }
      await this.botTaskQueueRepo.updateTaskContext(task.id, createdTaskContext);

      // Get bot's prompt from BotConfig
      const botConfig = await this.botConfigRepo.getBotConfigByAvatarId(task.avatarId);
      if (!botConfig) {
        this.logger.info({ taskId: task.id, avatarId: task.avatarId }, "No bot config found for avatar, skipping task");
        let failedTaskContext: PrismaJson.TaskContext;
        if (currentContext.type === "random_post") {
          failedTaskContext = {
            type: "random_post",
            status: "FAILED",
            error: "No bot config found",
          };
        } else {
          failedTaskContext = {
            type: "reply_post",
            replyToPostId: currentContext.replyToPostId,
            status: "FAILED",
            error: "No bot config found",
          };
        }
        await this.botTaskQueueRepo.updateTaskContext(task.id, failedTaskContext);
        await this.botTaskQueueRepo.updateTaskStatus(task.id, "FAILED");
        return;
      }

      // Create a combined prompt from bot's base prompt and task context
      const combinedPrompt = await this.createCombinedPrompt(botConfig.prompt, createdTaskContext, botConfig.prompt);

      // Send to LLM task queue with bot task reference
      const llmTask = await this.llmTaskQueueRepo.enqueueTask({
        avatarId: task.avatarId,
        prompt: combinedPrompt,
        botTaskQueueId: task.id,
        context: {
          status: "WAITING",
          prompt: combinedPrompt,
        },
      });

      // Update TaskContext with LLM task ID and LLM_QUEUED status
      let llmQueuedTaskContext: PrismaJson.TaskContext;
      if (currentContext.type === "random_post") {
        llmQueuedTaskContext = {
          type: "random_post",
          status: "LLM_QUEUED",
          llmTaskId: llmTask.id,
        };
      } else {
        llmQueuedTaskContext = {
          type: "reply_post",
          replyToPostId: currentContext.replyToPostId,
          status: "LLM_QUEUED",
          llmTaskId: llmTask.id,
        };
      }
      await this.botTaskQueueRepo.updateTaskContext(task.id, llmQueuedTaskContext);

      // Set overall status to EXTERNAL_WAITING (waiting for LLM processing)
      await QueueStatusManager.setBotTaskWaitingForLLM(this.botTaskQueueRepo, task.id);
      this.logger.info(
        { taskId: task.id, llmTaskId: llmTask.id, avatarId: task.avatarId },
        "Bot task queued to LLM with status LLM_QUEUED",
      );
    } catch (error) {
      this.logger.error(
        { taskId: task.id, avatarId: task.avatarId, error: error instanceof Error ? error.message : "Unknown error" },
        "Failed to process bot task",
      );
      const currentContext = task.task as PrismaJson.TaskContext;
      let failedTaskContext: PrismaJson.TaskContext;
      if (currentContext.type === "random_post") {
        failedTaskContext = {
          type: "random_post",
          status: "FAILED",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      } else {
        failedTaskContext = {
          type: "reply_post",
          replyToPostId: currentContext.replyToPostId,
          status: "FAILED",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
      await this.botTaskQueueRepo.updateTaskContext(task.id, failedTaskContext);
      await this.botTaskQueueRepo.updateTaskStatus(task.id, "FAILED");
    }
  }

  private async createCombinedPrompt(
    basePrompt: string,
    taskContext: PrismaJson.TaskContext,
    botPrompt: string,
  ): Promise<string> {
    // Create a combined prompt from the bot's base prompt and the task context
    let combinedPrompt = basePrompt;

    switch (taskContext.type) {
      case "random_post":
        combinedPrompt += "あなたは日常の投稿を作成するAIです。以下のキャラクターで投稿を作成してください。\n\n";
        combinedPrompt += "[キャラクター情報]" + botPrompt;
        break;
      case "reply_post":
        const originalPost = await this.postRepo.getPostById(taskContext.replyToPostId);
        if (!originalPost) {
          throw new Error(`Original post with ID ${taskContext.replyToPostId} not found`);
        }
        combinedPrompt += "\n\nあなたは他のユーザーの投稿に返信するAIです。";
        combinedPrompt += `以下の投稿に返信してください:\n\n[投稿]"${originalPost.content}"\n\n`;
        combinedPrompt += "[キャラクター情報]" + botPrompt;
        break;
    }
    return combinedPrompt;
  }
}
