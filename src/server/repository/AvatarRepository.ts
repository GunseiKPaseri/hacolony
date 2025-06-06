import { inject, injectable } from "tsyringe";
import type { AvatarRepository } from "./interface";
import { type DBClient, InvalidInputError } from "./util";
import { DI } from "../di.type";

@injectable()
export class AvatarRepositoryImpl implements AvatarRepository {
  constructor(@inject(DI.PrismaClient) private prisma: DBClient) {}

  async createAvatar(props: { name: string; userId: string; description?: string; imageUrl?: string; hidden?: boolean }) {
    const { name, userId, description, imageUrl, hidden } = props;

    if (!name) {
      throw new InvalidInputError("アバター名を入力してください");
    }

    const existingAvatar = await this.isExistAvatarByName(
      name,
      userId
    );

    if (existingAvatar) {
      throw new InvalidInputError("この名前のアバターは既に存在します");
    }

    const avatar = await this.prisma.avatar.create({
      data: {
        name,
        description,
        imageUrl,
        ownerId: userId,
        hidden: hidden ?? false,
      },
    });

    return avatar;
  }

  async isExistAvatarByName(name: string, userId: string) {
    const avatar = await this.prisma.avatar.findFirst({
      where: {
        ownerId: userId,
        name,
      },
    });
    return !!avatar;
  }

  async getAvatarsByUserId(userId: string) {
    const avatars = await this.prisma.avatar.findMany({
      where: {
        ownerId: userId,
      },
      include: {
        posts: true,
      },
    });
    return avatars;
  }

  async getBotFollowers(avatarId: string): Promise<{
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
}[]> {
    const followers = await this.prisma.avatar.findMany({
      where: {
        followers: {
          some: {
            followingId: avatarId,
          }
        },
        botConfig: {
          isNot: null,
        },
      },
      include: {
        botConfig: true
      }
    })
    return followers as {
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
    }[];
  }

}
