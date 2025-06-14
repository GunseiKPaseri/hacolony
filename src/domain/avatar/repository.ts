import type { Avatar, Post } from "@/generated/client";

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
  getAvatarById(avatarId: string): Promise<
    | (Avatar & {
        posts: Post[];
        followers: Array<{ id: string; name: string; imageUrl: string | null }>;
        followees: Array<{ id: string; name: string; imageUrl: string | null }>;
        botConfig: { id: string; prompt: string } | null;
      })
    | null
  >;
  updateAvatar(
    avatarId: string,
    props: {
      name?: string;
      description?: string;
      imageUrl?: string;
      hidden?: boolean;
    },
  ): Promise<Avatar>;
  getBotFollowers(avatarId: string): Promise<
    {
      botConfig: {
        id: string;
        avatarId: string;
        prompt: string;
      };
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
