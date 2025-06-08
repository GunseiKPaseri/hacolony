import { inject, injectable } from "tsyringe";
import type { Logger } from "pino";
import type { LlmTaskQueueRepository, PostQueueRepository, BotTaskQueueRepository } from "../repository/interface";
import { OllamaClient } from "../client/OllamaClient";
import { DI } from "../di.type";

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
      // Get pending LLM tasks
      const tasks = await this.llmTaskQueueRepo.getPendingTasks(10);

      for (const task of tasks) {
        try {
          // Mark LLM task as processing
          await this.llmTaskQueueRepo.updateTaskStatus(task.id, "PROCESSING");

          // Update BotTaskQueue status to LLM_PROCESSING
          if (task.botTaskQueueId) {
            const botTask = await this.botTaskQueueRepo.getTaskById(task.botTaskQueueId);
            if (botTask) {
              const updatedTaskContext: PrismaJson.TaskContext = {
                ...botTask.task,
                status: "LLM_PROCESSING",
              };
              await this.botTaskQueueRepo.updateTaskContext(task.botTaskQueueId, updatedTaskContext);
            }
          }

          // Generate post content using Ollama
          const response = await this.ollamaClient.generatePost(task.prompt);

          // Get replyToId from BotTaskQueue if this is a reply task
          let replyToId: string | undefined;
          if (task.botTaskQueueId) {
            const botTask = await this.botTaskQueueRepo.getTaskById(task.botTaskQueueId);
            if (botTask && botTask.task.type === "reply_post") {
              replyToId = botTask.task.replyToPostId;
            }
          }

          // Schedule post in PostQueue
          const postQueue = await this.postQueueRepo.schedulePost({
            avatarId: task.avatarId,
            content: response,
            scheduledAt: new Date(Date.now() + 5 * 60 * 1000), // Schedule for 5 minutes later
            replyToId: replyToId,
            botTaskQueueId: task.botTaskQueueId || undefined,
          });

          // Update BotTaskQueue TaskContext with PostQueue ID and LLM_COMPLETED status
          if (task.botTaskQueueId) {
            const botTask = await this.botTaskQueueRepo.getTaskById(task.botTaskQueueId);
            if (botTask) {
              const updatedTaskContext: PrismaJson.TaskContext = {
                ...botTask.task,
                status: "POST_QUEUED",
                postQueueId: postQueue.id,
              };
              await this.botTaskQueueRepo.updateTaskContext(task.botTaskQueueId, updatedTaskContext);
            }
          }

          // Mark task as completed
          await this.llmTaskQueueRepo.updateTaskStatus(task.id, "COMPLETED");

          this.logger.info({ taskId: task.id, avatarId: task.avatarId, postQueueId: postQueue.id }, "LLM task completed successfully");
        } catch (error) {
          this.logger.error({ 
            taskId: task.id, 
            avatarId: task.avatarId, 
            botTaskQueueId: task.botTaskQueueId,
            error: error instanceof Error ? error.message : "Unknown error" 
          }, "Failed to process LLM task");
          await this.llmTaskQueueRepo.updateTaskStatus(task.id, "FAILED");

          // Update BotTaskQueue with failed status
          if (task.botTaskQueueId) {
            const botTask = await this.botTaskQueueRepo.getTaskById(task.botTaskQueueId);
            if (botTask) {
              const updatedTaskContext: PrismaJson.TaskContext = {
                ...botTask.task,
                status: "FAILED",
                error: error instanceof Error ? error.message : "LLM processing failed",
              };
              await this.botTaskQueueRepo.updateTaskContext(task.botTaskQueueId, updatedTaskContext);
              await this.botTaskQueueRepo.updateTaskStatus(task.botTaskQueueId, "FAILED");
            }
          }
        }
      }
    } catch (error) {
      this.logger.error({ error: error instanceof Error ? error.message : "Unknown error" }, "Error processing LLM tasks");
    }
  }
}
