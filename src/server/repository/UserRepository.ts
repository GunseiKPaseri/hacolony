import { inject, injectable } from "tsyringe";
import type { UserRepository } from "./interface";
import { type DBClient, InvalidInputError, NotFoundError } from "./util";
import bcrypt from "bcryptjs";
import { DI } from "../di.type";

@injectable()
export class UserRepositoryImpl implements UserRepository {
  constructor(@inject(DI.PrismaClient) private prisma: DBClient) {}

  async createUser(props: { name: string; email: string; password: string }) {
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

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new NotFoundError("ユーザーが見つかりません");
    }
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
      },
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

  async addSelfAvatar(userId: string, avatarId: string) {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        selfAvatarId: avatarId,
      },
    });
  }

  async getSelfAvatar(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        selfAvatar: true,
      },
    });

    if (!user) {
      throw new NotFoundError("ユーザーが見つかりません");
    }

    return user.selfAvatar;
  }
}
