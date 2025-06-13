import { inject, injectable } from "tsyringe";
import type { Logger } from "pino";
import type { LlmTaskQueue } from "@/generated/client";
import type { LlmTaskQueueRepository, PostQueueRepository, BotTaskQueueRepository } from "../repository/interface";
import { OllamaClient } from "../client/OllamaClient";
import { DI } from "../di.type";
import { QueueStatusManager } from "./queueStatusManager";

@injectable()
export class LlmTaskWorker {
  constructor(
    @inject(DI.Logger) private readonly logger: Logger,
    @inject(DI.LlmTaskQueueRepository) private readonly llmTaskQueueRepo: LlmTaskQueueRepository,
    @inject(DI.PostQueueRepository) private readonly postQueueRepo: PostQueueRepository,
    @inject(DI.BotTaskQueueRepository) private readonly botTaskQueueRepo: BotTaskQueueRepository,
    @inject(DI.OllamaClient) private readonly ollamaClient: OllamaClient,
  ) {}

  async processTasks(): Promise<void> {
    try {
      // 現在処理中のタスク数を取得して、適切な取得数を決定
      const processingCount = await this.llmTaskQueueRepo.getProcessingCount();
      const maxConcurrent = 3; // LLMタスクは重いので同時実行数を制限
      const availableSlots = Math.max(0, maxConcurrent - processingCount);
      
      if (availableSlots === 0) {
        this.logger.debug({ processingCount, maxConcurrent }, "All slots occupied, skipping LLM task processing");
        return;
      }

      // Get pending LLM tasks
      const tasks = await this.llmTaskQueueRepo.getPendingTasks(availableSlots);

      if (tasks.length === 0) {
        return;
      }

      this.logger.info({ 
        taskCount: tasks.length, 
        processingCount, 
        availableSlots 
      }, "Processing LLM tasks concurrently");

      // 並行処理でタスクを実行
      const taskPromises = tasks.map(task => this.processTask(task));
      await Promise.allSettled(taskPromises);

    } catch (error) {
      this.logger.error({ error: error instanceof Error ? error.message : "Unknown error" }, "Error processing LLM tasks");
    }
  }

  private async processTask(task: LlmTaskQueue): Promise<void> {
    try {
      // Mark LLM task as processing
      await this.llmTaskQueueRepo.updateTaskStatus(task.id, "PROCESSING");

      // Update LLM context to PROCESSING with start time
      const processingContext: PrismaJson.LLMContext = {
        status: "PROCESSING",
        prompt: task.prompt,
        startedAt: new Date().toISOString(),
      };
      await this.llmTaskQueueRepo.updateTaskContext(task.id, processingContext);

      // Update BotTaskQueue status to LLM_PROCESSING
      if (task.botTaskQueueId) {
        const botTask = await this.botTaskQueueRepo.getTaskById(task.botTaskQueueId);
        if (botTask) {
          const currentContext = botTask.task as PrismaJson.TaskContext;
          let updatedTaskContext: PrismaJson.TaskContext | null = null;
          
          if (currentContext.type === "random_post") {
            if (currentContext.status === "LLM_QUEUED") {
              updatedTaskContext = {
                type: "random_post",
                status: "LLM_PROCESSING",
                llmTaskId: currentContext.llmTaskId,
              };
            } else {
              this.logger.warn({ 
                taskId: task.id, 
                botTaskQueueId: task.botTaskQueueId,
                currentStatus: currentContext.status 
              }, "Unexpected bot task status for LLM_PROCESSING");
              return;
            }
          } else {
            if (currentContext.status === "LLM_QUEUED") {
              updatedTaskContext = {
                type: "reply_post",
                replyToPostId: currentContext.replyToPostId,
                status: "LLM_PROCESSING",
                llmTaskId: currentContext.llmTaskId,
              };
            } else {
              this.logger.warn({ 
                taskId: task.id, 
                botTaskQueueId: task.botTaskQueueId,
                currentStatus: currentContext.status 
              }, "Unexpected bot task status for LLM_PROCESSING");
              return;
            }
          }
          
          if (updatedTaskContext) {
            await this.botTaskQueueRepo.updateTaskContext(task.botTaskQueueId, updatedTaskContext);
          }
        }
      }

      // Generate post content using Ollama
      const response = await this.ollamaClient.generatePost(task.prompt);

      // Update LlmTaskQueue context with the generated response
      const responsedContext: PrismaJson.LLMContext = {
        status: "RESPONSED",
        prompt: task.prompt,
        response: response,
        completedAt: new Date().toISOString(),
      };
      await this.llmTaskQueueRepo.updateTaskContext(task.id, responsedContext);

      // Get replyToId from BotTaskQueue if this is a reply task
      let replyToId: string | undefined;
      if (task.botTaskQueueId) {
        const botTask = await this.botTaskQueueRepo.getTaskById(task.botTaskQueueId);
        if (botTask) {
          const currentContext = botTask.task as PrismaJson.TaskContext;
          if (currentContext.type === "reply_post") {
            replyToId = currentContext.replyToPostId;
          }
        }
      }

      // Create PostQueue context
      const postContext: PrismaJson.PostQueueContext = {
        status: "SCHEDULED",
        content: response,
        scheduledAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      };

      // Schedule post in PostQueue
      const postQueue = await this.postQueueRepo.schedulePost({
        avatarId: task.avatarId,
        content: response,
        scheduledAt: new Date(Date.now() + 5 * 60 * 1000), // Schedule for 5 minutes later
        context: postContext,
        replyToId: replyToId,
        botTaskQueueId: task.botTaskQueueId || undefined,
      });

      // Update BotTaskQueue TaskContext with PostQueue ID and POST_QUEUED status
      if (task.botTaskQueueId) {
        const botTask = await this.botTaskQueueRepo.getTaskById(task.botTaskQueueId);
        if (botTask) {
          const currentContext = botTask.task as PrismaJson.TaskContext;
          let updatedTaskContext: PrismaJson.TaskContext | null = null;
          
          if (currentContext.type === "random_post") {
            if (currentContext.status === "LLM_PROCESSING") {
              updatedTaskContext = {
                type: "random_post",
                status: "POST_QUEUED",
                llmTaskId: currentContext.llmTaskId,
                postQueueId: postQueue.id,
              };
            } else {
              this.logger.warn({ 
                taskId: task.id, 
                botTaskQueueId: task.botTaskQueueId,
                currentStatus: currentContext.status 
              }, "Unexpected bot task status for POST_QUEUED");
              return;
            }
          } else {
            if (currentContext.status === "LLM_PROCESSING") {
              updatedTaskContext = {
                type: "reply_post",
                replyToPostId: currentContext.replyToPostId,
                status: "POST_QUEUED",
                llmTaskId: currentContext.llmTaskId,
                postQueueId: postQueue.id,
              };
            } else {
              this.logger.warn({ 
                taskId: task.id, 
                botTaskQueueId: task.botTaskQueueId,
                currentStatus: currentContext.status 
              }, "Unexpected bot task status for POST_QUEUED");
              return;
            }
          }
          
          if (updatedTaskContext) {
            await this.botTaskQueueRepo.updateTaskContext(task.botTaskQueueId, updatedTaskContext);
          }
        }
      }

      // Mark LLM task as completed
      await this.llmTaskQueueRepo.updateTaskStatus(task.id, "COMPLETED");

      // Notify that LLM task is completed - this will set BotTaskQueue back to QUEUE_WAITING
      if (task.botTaskQueueId) {
        await QueueStatusManager.notifyLLMTaskCompleted(this.botTaskQueueRepo, task.botTaskQueueId);
      }

      this.logger.info({ taskId: task.id, avatarId: task.avatarId, postQueueId: postQueue.id }, "LLM task completed successfully");
    } catch (error) {
      this.logger.error({ 
        taskId: task.id, 
        avatarId: task.avatarId, 
        botTaskQueueId: task.botTaskQueueId,
        error: error instanceof Error ? error.message : "Unknown error" 
      }, "Failed to process LLM task");

      // Update LlmTaskQueue context with error information
      const errorContext: PrismaJson.LLMContext = {
        status: "FAILED",
        prompt: task.prompt,
        error: error instanceof Error ? error.message : "Unknown error",
        failedAt: new Date().toISOString(),
      };
      await this.llmTaskQueueRepo.updateTaskContext(task.id, errorContext);

      await this.llmTaskQueueRepo.updateTaskStatus(task.id, "FAILED");

      // Update BotTaskQueue with failed status
      if (task.botTaskQueueId) {
        const botTask = await this.botTaskQueueRepo.getTaskById(task.botTaskQueueId);
        if (botTask) {
          const currentContext = botTask.task as PrismaJson.TaskContext;
          let failedTaskContext: PrismaJson.TaskContext;
          
          if (currentContext.type === "random_post") {
            failedTaskContext = {
              type: "random_post",
              status: "FAILED",
              error: error instanceof Error ? error.message : "LLM processing failed",
              ...(currentContext.status === "LLM_PROCESSING" && {
                llmTaskId: currentContext.llmTaskId,
              }),
            };
          } else {
            failedTaskContext = {
              type: "reply_post",
              replyToPostId: currentContext.replyToPostId,
              status: "FAILED",
              error: error instanceof Error ? error.message : "LLM processing failed",
              ...(currentContext.status === "LLM_PROCESSING" && {
                llmTaskId: currentContext.llmTaskId,
              }),
            };
          }
          await this.botTaskQueueRepo.updateTaskContext(task.botTaskQueueId, failedTaskContext);
          await QueueStatusManager.notifyLLMTaskFailed(this.botTaskQueueRepo, task.botTaskQueueId);
        }
      }
    }
  }
}
