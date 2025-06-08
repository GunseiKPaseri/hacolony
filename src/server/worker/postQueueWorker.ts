import { inject, injectable } from "tsyringe";
import type { Logger } from "pino";
import type { PostQueueRepository, PostRepository, BotTaskQueueRepository } from "../repository/interface";
import { DI } from "../di.type";

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
      // Get posts due to be posted now
      const duePosts = await this.postQueueRepo.getDuePosts(10);

      for (const post of duePosts) {
        try {
          // Update BotTaskQueue status to POST_PROCESSING if this is a bot task
          if (post.botTaskQueueId) {
            const botTask = await this.botTaskQueueRepo.getTaskById(post.botTaskQueueId);
            if (botTask) {
              const updatedTaskContext: PrismaJson.TaskContext = {
                ...botTask.task,
                status: "POST_PROCESSING",
              };
              await this.botTaskQueueRepo.updateTaskContext(post.botTaskQueueId, updatedTaskContext);
              await this.botTaskQueueRepo.updateTaskStatus(post.botTaskQueueId, "PROCESSING");
            }
          }

          // Create actual post
          const createdPost = await this.postRepo.createPostByAvatarId({
            content: post.content,
            postedByAvatarId: post.avatarId,
            replyToId: post.replyToId ?? null,
          });

          // Update BotTaskQueue with completed status and post ID
          if (post.botTaskQueueId) {
            const botTask = await this.botTaskQueueRepo.getTaskById(post.botTaskQueueId);
            if (botTask) {
              const updatedTaskContext: PrismaJson.TaskContext = {
                ...botTask.task,
                status: "POST_COMPLETED",
                postId: createdPost.id,
              };
              await this.botTaskQueueRepo.updateTaskContext(post.botTaskQueueId, updatedTaskContext);
              await this.botTaskQueueRepo.updateTaskStatus(post.botTaskQueueId, "COMPLETED");
            }
          }

          // Mark post as processed
          await this.postQueueRepo.markPostAsProcessed(post.id);

          this.logger.info({ 
            postQueueId: post.id, 
            createdPostId: createdPost.id, 
            avatarId: post.avatarId,
            botTaskQueueId: post.botTaskQueueId
          }, "Post successfully created from queue");
        } catch (error) {
          this.logger.error({ 
            postQueueId: post.id, 
            avatarId: post.avatarId,
            botTaskQueueId: post.botTaskQueueId,
            error: error instanceof Error ? error.message : "Unknown error" 
          }, "Failed to post scheduled post");

          // Update BotTaskQueue with failed status
          if (post.botTaskQueueId) {
            const botTask = await this.botTaskQueueRepo.getTaskById(post.botTaskQueueId);
            if (botTask) {
              const updatedTaskContext: PrismaJson.TaskContext = {
                ...botTask.task,
                status: "FAILED",
                error: error instanceof Error ? error.message : "Unknown error",
              };
              await this.botTaskQueueRepo.updateTaskContext(post.botTaskQueueId, updatedTaskContext);
              await this.botTaskQueueRepo.updateTaskStatus(post.botTaskQueueId, "FAILED");
            }
          }
        }
      }
    } catch (error) {
      this.logger.error({ error: error instanceof Error ? error.message : "Unknown error" }, "Error processing scheduled posts");
    }
  }
}
