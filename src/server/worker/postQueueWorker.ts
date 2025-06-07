import { inject, injectable } from "tsyringe";
import type { PostQueueRepository, PostRepository, BotTaskQueueRepository } from "../repository/interface";
import { DI } from "../di.type";

@injectable()
export class PostQueueWorker {
  constructor(
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

          console.log(`Post ${post.id} successfully created as post ${createdPost.id}`);
        } catch (error) {
          console.error(`Failed to post scheduled post ${post.id}:`, error);

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
      console.error("Error processing scheduled posts:", error);
    }
  }
}
