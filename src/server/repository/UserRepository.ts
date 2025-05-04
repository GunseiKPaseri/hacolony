import type { PrismaClient } from "@/generated/client";
import type { UserRepository } from "./interface";
import { InvalidInputError, NotFoundError } from "./util";
import bcrypt from "bcryptjs";

export default class DBUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async createUser(props: {
    name: string;
    email: string;
    password: string;
  }) {
    const { name, email, password } = props;

    const existingUser = await this.isExistUserByEmail(email);

    if (existingUser) {
      throw new InvalidInputError("このメールアドレスは既に使用されています");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return user;
  }

  async getUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      throw new NotFoundError("ユーザーが見つかりません");
    }
    return user;
  }

  async getUserByIdWithAvatar(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        selfAvatar: true,
      }
    });
    if (user === null) {
      throw new NotFoundError("ユーザーが見つかりません");
    }
    return user;
  }

  async isExistUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    return !!user;
  }

  async hasAvatar(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        selfAvatarId: true,
      },
    });

    if (!user) {
      throw new NotFoundError("ユーザーが見つかりません");
    }

    return !!user.selfAvatarId;
  }

  async createSelfAvatar(props: {userId: string, name: string, description?: string, imageUrl?: string, hidden?: boolean}) {
    const { userId, name, description, imageUrl, hidden } = props;

    if (!name) {
      throw new InvalidInputError("アバター名を入力してください");
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: props.userId,
      },
    });

    if (!user) {
      throw new NotFoundError("ユーザーが見つかりません");
    }

    const existingAvatar = await this.prisma.avatar.findFirst({
      where: {
        ownerId: userId,
        name,
      },
    });

    if(existingAvatar){
      throw new InvalidInputError("この名前のアバターは既に存在します");
    };

    const avatar = await this.prisma.avatar.create({
      data: {
        name,
        description,
        imageUrl,
        ownerId: userId,
        hidden: hidden ?? false,
      },
    });

    await this.prisma.user.update({
      where: {
        id: props.userId,
      },
      data: {
        selfAvatarId: avatar.id,
      },
    });
    return avatar;
  }
}
