import { Post, Avatar, User, BotTaskQueue, PostQueue, LlmTaskQueue } from "@/generated/client";

export interface AvatarRepository {
  createAvatar(props: {
    name: string;
    userId: string;
    description?: string;
    imageUrl?: string;
    hidden?: boolean;
  }): Promise<Avatar>;
  isExistAvatarByName(name: string, userId: string): Promise<boolean>;
  getAvatarsByUserId(userId: string): Promise<Avatar[]>;
  getAvatarById(avatarId: string): Promise<Avatar & { 
    posts: Post[];
    followers: Array<{ id: string; name: string; imageUrl: string | null }>;
    followees: Array<{ id: string; name: string; imageUrl: string | null }>;
    botConfig: { id: string; prompt: string } | null;
  } | null>;
  updateAvatar(avatarId: string, props: {
    name?: string;
    description?: string;
    imageUrl?: string;
    hidden?: boolean;
  }): Promise<Avatar>;
  getBotFollowers(avatarId: string): Promise<
    {
      botConfig: {
        id: string;
        avatarId: string;
        prompt: string;
      } | null;
      name: string;
      id: string;
      description: string | null;
      imageUrl: string | null;
      hidden: boolean;
      ownerId: string;
      createdAt: Date;
      updatedAt: Date;
    }[]
  >;
}

export interface BotConfigRepository {
  createBotConfig(props: { avatarId: string; prompt: string }): Promise<{ id: string; prompt: string }>;
  getBotConfigByAvatarId(avatarId: string): Promise<{ id: string; prompt: string } | null>;
}

export interface FollowRepository {
  followAvatar(following: { followerId: string; followeeId: string }[]): Promise<void>;
  unfollowAvatar(following: { followerId: string; followeeId: string }[]): Promise<void>;
  getFollowers(avatarId: string): Promise<{ id: string; name: string; imageUrl: string | null }[]>;
  getFollowee(avatarId: string): Promise<{ id: string; name: string; imageUrl: string | null }[]>;
  isFollowing(followerId: string, followeeId: string): Promise<boolean>;
}

export interface PostRepository {
  getPostsByUserId(userId: string): Promise<Post[]>;
  createPostByAvatarId(props: { content: string; postedByAvatarId: string; replyToId: string | null }): Promise<Post>;
  createPostByUserId(props: { content: string; postedByUserId: string; replyToId: string | null }): Promise<Post>;
  getPostById(postId: string): Promise<Post | null>;
}

export interface BotTaskQueueRepository {
  enqueueTask(params: { avatarId: string; task: PrismaJson.TaskContext }): Promise<BotTaskQueue>;
  getPendingTasks(limit?: number): Promise<BotTaskQueue[]>;
  updateTaskStatus(id: string, status: string): Promise<void>;
  updateTaskContext(id: string, taskContext: PrismaJson.TaskContext): Promise<void>;
  getTaskById(id: string): Promise<BotTaskQueue | null>;
}

export interface LlmTaskQueueRepository {
  enqueueTask(params: {
    avatarId: string;
    prompt: string;
    context?: PrismaJson.LLMContext;
    botTaskQueueId?: string;
  }): Promise<LlmTaskQueue>;
  getPendingTasks(limit?: number): Promise<LlmTaskQueue[]>;
  updateTaskStatus(id: string, status: string): Promise<void>;
}

export interface PostQueueRepository {
  schedulePost(params: {
    avatarId: string;
    content: string;
    scheduledAt: Date;
    replyToId?: string;
    botTaskQueueId?: string;
  }): Promise<PostQueue>;
  getDuePosts(limit?: number): Promise<PostQueue[]>;
  markPostAsProcessed(id: string): Promise<void>;
}

export interface UserRepository {
  createUser(props: { name: string; email: string; password: string; selfAvatarId?: string }): Promise<User>;
  getUserByEmail(email: string): Promise<User>;
  getUserById(userId: string): Promise<User | null>;
  getUserByIdWithAvatar(userId: string): Promise<User & { selfAvatar: Avatar | null }>;
  isExistUserByEmail(email: string): Promise<boolean>;
  hasAvatar(userId: string): Promise<boolean>;
  addSelfAvatar(userId: string, avatarId: string): Promise<void>;
  getSelfAvatar(userId: string): Promise<Avatar | null>;
}
