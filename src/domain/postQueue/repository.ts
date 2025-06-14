import type { PostQueue } from "@/generated/client";

export interface PostQueueRepository {
  schedulePost(params: {
    avatarId: string;
    content: string;
    scheduledAt: Date;
    context?: PrismaJson.PostQueueContext;
    replyToId?: string;
    botTaskQueueId?: string;
  }): Promise<PostQueue>;
  getDuePosts(limit?: number): Promise<PostQueue[]>;
  getProcessingCount(): Promise<number>;
  updatePostContext(id: string, context: PrismaJson.PostQueueContext): Promise<void>;
  markPostAsProcessed(id: string): Promise<void>;
  getPostById(id: string): Promise<PostQueue | null>;
}
