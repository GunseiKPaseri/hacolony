import { inject, injectable } from "tsyringe";
import type { Logger } from "pino";
import type { BotTaskQueueRepository } from "../../domain/botTaskQueue/repository";
import type { AvatarRepository } from "../../domain/avatar/repository";
import { DI } from "../../server/di.type";

@injectable()
export class BotReplyService {
  constructor(
    @inject(DI.Logger) private readonly logger: Logger,
    @inject(DI.AvatarRepository) private readonly avatarRepo: AvatarRepository,
    @inject(DI.BotTaskQueueRepository) private readonly botTaskQueueRepo: BotTaskQueueRepository,
  ) {}

  async triggerBotReplies(postId: string, authorAvatarId: string): Promise<void> {
    try {
      const botFollowers = await this.avatarRepo.getBotFollowers(authorAvatarId);
      this.logger.info(
        {
          postId,
          authorAvatarId,
          botFollowersCount: botFollowers.length,
        },
        "Found bot followers for avatar",
      );

      for (const followerAvatar of botFollowers) {
        try {
          // Try to create a bot task - if avatar doesn't have botConfig, it will be skipped in botTaskWorker
          await this.botTaskQueueRepo.enqueueTask({
            avatarId: followerAvatar.id,
            task: {
              type: "reply_post",
              replyToPostId: postId,
              status: "CREATED",
            },
          });
        } catch (error) {
          this.logger.warn(
            {
              avatarId: followerAvatar.id,
              postId,
              error: error instanceof Error ? error.message : "Unknown error",
            },
            "Could not queue bot task for avatar",
          );
        }
      }
    } catch (error) {
      this.logger.error(
        {
          postId,
          authorAvatarId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        "Error triggering bot replies",
      );
    }
  }

  async triggerRandomBotPosts(): Promise<void> {
    try {
      // This method can be called periodically to generate random posts from bots
      // For now, we'll implement a simple version
      this.logger.info({}, "Triggering random bot posts");
    } catch (error) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        "Error triggering random bot posts",
      );
    }
  }
}
