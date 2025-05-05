import { AvatarRepository } from "./interface";
import { type DBClient, InvalidInputError } from "./util";

export default class DBAvatarRepository implements AvatarRepository {
  constructor(private prisma: DBClient) {}

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
}
