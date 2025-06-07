import { inject, injectable } from "tsyringe";
import type {
  BotTaskQueueRepository,
  LlmTaskQueueRepository,
  BotConfigRepository,
  PostRepository,
} from "../repository/interface";
import { DI } from "../di.type";

@injectable()
export class BotTaskWorker {
  constructor(
    @inject(DI.BotConfigRepository) private readonly botConfigRepo: BotConfigRepository,
    @inject(DI.BotTaskQueueRepository) private readonly botTaskQueueRepo: BotTaskQueueRepository,
    @inject(DI.LlmTaskQueueRepository) private readonly llmTaskQueueRepo: LlmTaskQueueRepository,
    @inject(DI.PostRepository) private readonly postRepo: PostRepository,
  ) {}

  async processTasks(): Promise<void> {
    try {
      // Get pending bot tasks
      const tasks = await this.botTaskQueueRepo.getPendingTasks(10);

      for (const task of tasks) {
        try {
          // Mark task as processing (overall queue status)
          await this.botTaskQueueRepo.updateTaskStatus(task.id, "PROCESSING");

          // Update TaskContext to CREATED status
          const initialTaskContext: PrismaJson.TaskContext = {
            ...task.task,
            status: "CREATED",
          };
          await this.botTaskQueueRepo.updateTaskContext(task.id, initialTaskContext);

          // Get bot's prompt from BotConfig
          const botConfig = await this.botConfigRepo.getBotConfigByAvatarId(task.avatarId);
          if (!botConfig) {
            console.log(`No bot config found for avatar ${task.avatarId}, skipping task ${task.id}`);
            const failedTaskContext: PrismaJson.TaskContext = {
              ...task.task,
              status: "FAILED",
              error: "No bot config found",
            };
            await this.botTaskQueueRepo.updateTaskContext(task.id, failedTaskContext);
            await this.botTaskQueueRepo.updateTaskStatus(task.id, "FAILED");
            continue;
          }

          // Create a combined prompt from bot's base prompt and task context
          const combinedPrompt = await this.createCombinedPrompt(botConfig.prompt, task.task, botConfig.prompt);

          // Send to LLM task queue with bot task reference
          const llmTask = await this.llmTaskQueueRepo.enqueueTask({
            avatarId: task.avatarId,
            prompt: combinedPrompt,
            botTaskQueueId: task.id,
            context: {
              systemPrompt: combinedPrompt,
            },
          });

          // Update TaskContext with LLM task ID and LLM_QUEUED status
          const llmQueuedTaskContext: PrismaJson.TaskContext = {
            ...task.task,
            status: "LLM_QUEUED",
            llmTaskId: llmTask.id,
          };
          await this.botTaskQueueRepo.updateTaskContext(task.id, llmQueuedTaskContext);

          // Keep overall status as PROCESSING (will be updated when completely done)
          console.log(`Bot task ${task.id} queued to LLM with status LLM_QUEUED`);

          console.log(`Bot task ${task.id} processed and sent to LLM queue`);
        } catch (error) {
          console.error(`Failed to process bot task ${task.id}:`, error);
          const failedTaskContext: PrismaJson.TaskContext = {
            ...task.task,
            status: "FAILED",
            error: error instanceof Error ? error.message : "Unknown error",
          };
          await this.botTaskQueueRepo.updateTaskContext(task.id, failedTaskContext);
          await this.botTaskQueueRepo.updateTaskStatus(task.id, "FAILED");
        }
      }
    } catch (error) {
      console.error("Error processing bot tasks:", error);
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
