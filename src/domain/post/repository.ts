import type { Post } from "@/generated/client";

export interface PostRepository {
  getPostsByUserId(userId: string): Promise<Post[]>;
  getTimelinePostsByUserId(userId: string): Promise<Post[]>;
  createPostByAvatarId(props: { content: string; postedByAvatarId: string; replyToId: string | null }): Promise<Post>;
  createPostByUserId(props: { content: string; postedByUserId: string; replyToId: string | null }): Promise<Post>;
  getPostById(postId: string): Promise<Post | null>;
}
