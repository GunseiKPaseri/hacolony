import { inject, injectable } from "tsyringe";
import type { BotTaskQueueRepository, AvatarRepository } from "../repository/interface";
import { DI } from "../di.type";

@injectable()
export class BotReplyService {
  constructor(
    @inject(DI.AvatarRepository) private readonly avatarRepo: AvatarRepository,
    @inject(DI.BotTaskQueueRepository) private readonly botTaskQueueRepo: BotTaskQueueRepository,
  ) {}

  async triggerBotReplies(postId: string, authorAvatarId: string): Promise<void> {
    try {
      const botFollowers = await this.avatarRepo.getBotFollowers(authorAvatarId);
      console.log(`Found ${botFollowers.length} followers for avatar ${authorAvatarId}`);

      for (const followerAvatar of botFollowers) {
        try {
          // Try to create a bot task - if avatar doesn't have botConfig, it will be skipped in botTaskWorker
          await this.botTaskQueueRepo.enqueueTask({
            avatarId: followerAvatar.id,
            task: {
              type: "reply_post",
              replyToPostId: postId,
            },
          });
        } catch (error) {
          console.log(`Could not queue bot task for avatar ${followerAvatar.id}:`, error);
        }
      }
    } catch (error) {
      console.error("Error triggering bot replies:", error);
    }
  }

  async triggerRandomBotPosts(): Promise<void> {
    try {
      // This method can be called periodically to generate random posts from bots
      // For now, we'll implement a simple version
      console.log("Triggering random bot posts...");
    } catch (error) {
      console.error("Error triggering random bot posts:", error);
    }
  }
}
