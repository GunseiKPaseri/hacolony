import { Post, Avatar, User } from "@/generated/client";

export interface AvatarRepository {
  createAvatar(props: {name: string, userId: string; description?: string; imageUrl?: string; hidden?: boolean}): Promise<Avatar>;
  isExistAvatarByName(name: string, userId: string): Promise<boolean>;
  getAvatarsByUserId(userId: string): Promise<Avatar[]>;
}

export interface BotConfigRepository {
  createBotConfig(props: {avatarId: string, prompt: string}): Promise<{id: string, prompt: string}>;
}

export interface FollowRepository {
  followAvatar(following: {followerId: string, followingId: string}[]): Promise<void>;
  unfollowAvatar(following: {followerId: string, followingId: string}[]): Promise<void>;
  getFollowers(avatarId: string): Promise<{id: string, name: string, imageUrl: string | null}[]>;
  getFollowing(avatarId: string): Promise<{id: string, name: string, imageUrl: string | null}[]>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
}

export interface PostRepository {
  getPostsByUserId(userId: string): Promise<Post[]>;
  createPostByAvatarId(props: {content: string, postedByAvatarId: string, replyToId: string | null}): Promise<Post>;
  createPostByUserId(props: {content: string, postedByUserId: string, replyToId: string | null}): Promise<Post>;
}

export interface UserRepository {
  createUser(props: {
    name: string;
    email: string;
    password: string;
  }): Promise<User>;
  getUserByEmail(email: string): Promise<User>;
  getUserByIdWithAvatar(userId: string): Promise<User & { selfAvatar: Avatar | null }>;
  isExistUserByEmail(email: string): Promise<boolean>;
  hasAvatar(userId: string): Promise<boolean>;
  getAvatar(userId: string): Promise<Avatar | null>;
  createSelfAvatar(props: {userId: string, name: string, description?: string, imageUrl?: string, hidden?: boolean}): Promise<Avatar>;
}
