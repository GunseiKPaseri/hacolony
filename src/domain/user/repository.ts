import type { User, Avatar } from "@/generated/client";

export interface UserRepository {
  createUser(props: { name: string; email: string; password: string; selfAvatarId?: string }): Promise<User>;
  getUserByEmail(email: string): Promise<User>;
  getUserById(userId: string): Promise<User | null>;
  getUserByIdWithAvatar(userId: string): Promise<User & { selfAvatar: Avatar | null }>;
  isExistUserByEmail(email: string): Promise<boolean>;
  hasAvatar(userId: string): Promise<boolean>;
  addSelfAvatar(userId: string, avatarId: string): Promise<void>;
  getSelfAvatar(userId: string): Promise<Avatar | null>;
  updateUser(userId: string, updates: Record<string, string>): Promise<User>;
}
