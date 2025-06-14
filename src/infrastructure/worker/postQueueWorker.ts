import { inject, injectable } from "tsyringe";
import type { Logger } from "pino";
import type { PostQueue } from "@/generated/client";
import type { PostQueueRepository } from "../../domain/postQueue/repository";
import type { PostRepository } from "../../domain/post/repository";
import type { BotTaskQueueRepository } from "../../domain/botTaskQueue/repository";
import { DI } from "../../server/di.type";
import { QueueStatusManager } from "./queueStatusManager";

@injectable()
export class PostQueueWorker {
  constructor(
    @inject(DI.Logger) private readonly logger: Logger,
    @inject(DI.PostQueueRepository) private readonly postQueueRepo: PostQueueRepository,
    @inject(DI.PostRepository) private readonly postRepo: PostRepository,
    @inject(DI.BotTaskQueueRepository) private readonly botTaskQueueRepo: BotTaskQueueRepository,
  ) {}

  async processDuePosts(): Promise<void> {
    try {
      // 現在処理中のタスク数を取得して、適切な取得数を決定
      const processingCount = await this.postQueueRepo.getProcessingCount();
      const maxConcurrent = 8; // 投稿処理は比較的軽いので多めに設定
      const availableSlots = Math.max(0, maxConcurrent - processingCount);

      if (availableSlots === 0) {
        this.logger.debug({ processingCount, maxConcurrent }, "All slots occupied, skipping post queue processing");
        return;
      }

      // Get posts due to be posted now
      const duePosts = await this.postQueueRepo.getDuePosts(availableSlots);

      if (duePosts.length === 0) {
        return;
      }

      this.logger.info(
        {
          postCount: duePosts.length,
          processingCount,
          availableSlots,
        },
        "Processing post queue concurrently",
      );

      // 並行処理でタスクを実行
      const postPromises = duePosts.map((post) => this.processPost(post));
      await Promise.allSettled(postPromises);
    } catch (error) {
      this.logger.error(
        { error: error instanceof Error ? error.message : "Unknown error" },
        "Error processing scheduled posts",
      );
    }
  }

  private async processPost(post: PostQueue): Promise<void> {
    try {
      // Update PostQueue context to POSTING
      const postingContext: PrismaJson.PostQueueContext = {
        status: "POSTING",
        content: post.content,
        scheduledAt: post.scheduledAt.toISOString(),
        startedAt: new Date().toISOString(),
      };
      await this.postQueueRepo.updatePostContext(post.id, postingContext);

      // Update BotTaskQueue status to POST_PROCESSING if this is a bot task
      if (post.botTaskQueueId) {
        const botTask = await this.botTaskQueueRepo.getTaskById(post.botTaskQueueId);
        if (botTask) {
          const currentContext = botTask.task as PrismaJson.TaskContext;
          let updatedTaskContext: PrismaJson.TaskContext | null = null;

          if (currentContext.type === "random_post") {
            // POST_QUEUEDステータスでllmTaskIdとpostQueueIdが必要
            if (currentContext.status === "POST_QUEUED") {
              updatedTaskContext = {
                type: "random_post",
                status: "POST_PROCESSING",
                llmTaskId: currentContext.llmTaskId,
                postQueueId: currentContext.postQueueId,
              };
            } else {
              // 想定外のステータスの場合はエラーとして処理
              this.logger.warn(
                {
                  postQueueId: post.id,
                  botTaskQueueId: post.botTaskQueueId,
                  currentStatus: currentContext.status,
                },
                "Unexpected bot task status for POST_PROCESSING",
              );
              return;
            }
          } else {
            // reply_post
            if (currentContext.status === "POST_QUEUED") {
              updatedTaskContext = {
                type: "reply_post",
                replyToPostId: currentContext.replyToPostId,
                status: "POST_PROCESSING",
                llmTaskId: currentContext.llmTaskId,
                postQueueId: currentContext.postQueueId,
              };
            } else {
              this.logger.warn(
                {
                  postQueueId: post.id,
                  botTaskQueueId: post.botTaskQueueId,
                  currentStatus: currentContext.status,
                },
                "Unexpected bot task status for POST_PROCESSING",
              );
              return;
            }
          }

          if (updatedTaskContext) {
            await this.botTaskQueueRepo.updateTaskContext(post.botTaskQueueId, updatedTaskContext);
            await this.botTaskQueueRepo.updateTaskStatus(post.botTaskQueueId, "PROCESSING");
          }
        }
      }

      // Create actual post
      const createdPost = await this.postRepo.createPostByAvatarId({
        content: post.content,
        postedByAvatarId: post.avatarId,
        replyToId: post.replyToId ?? null,
      });

      // Update PostQueue context to POSTED
      const postedContext: PrismaJson.PostQueueContext = {
        status: "POSTED",
        content: post.content,
        scheduledAt: post.scheduledAt.toISOString(),
        postId: createdPost.id,
        postedAt: new Date().toISOString(),
      };
      await this.postQueueRepo.updatePostContext(post.id, postedContext);

      // Update BotTaskQueue with completed status and post ID
      if (post.botTaskQueueId) {
        const botTask = await this.botTaskQueueRepo.getTaskById(post.botTaskQueueId);
        if (botTask) {
          const currentContext = botTask.task as PrismaJson.TaskContext;
          let updatedTaskContext: PrismaJson.TaskContext | null = null;

          if (currentContext.type === "random_post") {
            if (currentContext.status === "POST_PROCESSING") {
              updatedTaskContext = {
                type: "random_post",
                status: "POST_COMPLETED",
                llmTaskId: currentContext.llmTaskId,
                postQueueId: currentContext.postQueueId,
                postId: createdPost.id,
              };
            } else {
              this.logger.warn(
                {
                  postQueueId: post.id,
                  botTaskQueueId: post.botTaskQueueId,
                  currentStatus: currentContext.status,
                },
                "Unexpected bot task status for POST_COMPLETED",
              );
              return;
            }
          } else {
            if (currentContext.status === "POST_PROCESSING") {
              updatedTaskContext = {
                type: "reply_post",
                replyToPostId: currentContext.replyToPostId,
                status: "POST_COMPLETED",
                llmTaskId: currentContext.llmTaskId,
                postQueueId: currentContext.postQueueId,
                postId: createdPost.id,
              };
            } else {
              this.logger.warn(
                {
                  postQueueId: post.id,
                  botTaskQueueId: post.botTaskQueueId,
                  currentStatus: currentContext.status,
                },
                "Unexpected bot task status for POST_COMPLETED",
              );
              return;
            }
          }

          if (updatedTaskContext) {
            await this.botTaskQueueRepo.updateTaskContext(post.botTaskQueueId, updatedTaskContext);
            await QueueStatusManager.notifyPostQueueCompleted(this.botTaskQueueRepo, post.botTaskQueueId);
          }
        }
      }

      // Mark post as processed
      await this.postQueueRepo.markPostAsProcessed(post.id);

      this.logger.info(
        {
          postQueueId: post.id,
          createdPostId: createdPost.id,
          avatarId: post.avatarId,
          botTaskQueueId: post.botTaskQueueId,
        },
        "Post successfully created from queue",
      );
    } catch (error) {
      this.logger.error(
        {
          postQueueId: post.id,
          avatarId: post.avatarId,
          botTaskQueueId: post.botTaskQueueId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        "Failed to post scheduled post",
      );

      // Update PostQueue context to FAILED
      const failedContext: PrismaJson.PostQueueContext = {
        status: "FAILED",
        content: post.content,
        scheduledAt: post.scheduledAt.toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        failedAt: new Date().toISOString(),
      };
      await this.postQueueRepo.updatePostContext(post.id, failedContext);

      // Update BotTaskQueue with failed status
      if (post.botTaskQueueId) {
        const botTask = await this.botTaskQueueRepo.getTaskById(post.botTaskQueueId);
        if (botTask) {
          const currentContext = botTask.task as PrismaJson.TaskContext;
          let failedTaskContext: PrismaJson.TaskContext;

          if (currentContext.type === "random_post") {
            // 現在のコンテキストから利用可能な情報を取得
            failedTaskContext = {
              type: "random_post",
              status: "FAILED",
              error: error instanceof Error ? error.message : "Unknown error",
              ...(currentContext.status === "POST_PROCESSING" && {
                llmTaskId: currentContext.llmTaskId,
                postQueueId: currentContext.postQueueId,
              }),
            };
          } else {
            failedTaskContext = {
              type: "reply_post",
              replyToPostId: currentContext.replyToPostId,
              status: "FAILED",
              error: error instanceof Error ? error.message : "Unknown error",
              ...(currentContext.status === "POST_PROCESSING" && {
                llmTaskId: currentContext.llmTaskId,
                postQueueId: currentContext.postQueueId,
              }),
            };
          }
          await this.botTaskQueueRepo.updateTaskContext(post.botTaskQueueId, failedTaskContext);
          await QueueStatusManager.notifyPostQueueFailed(this.botTaskQueueRepo, post.botTaskQueueId);
        }
      }
    }
  }
}
