import { inject, injectable } from "tsyringe";
import type { UserRepository } from "../repository/interface";
import { DI } from "../di.type";
import { InvalidInputError } from "../repository/util";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export interface UserWithAvatar {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  password: string;
  selfAvatarId: string | null;
  selfAvatar: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    hidden: boolean;
    createdAt: Date;
    updatedAt: Date;
    ownerId: string;
  } | null;
}

@injectable()
export class UserService {
  constructor(
    @inject(DI.AvatarRepository) private readonly avatarRepository: UserRepository,
    @inject(DI.UserRepository) private readonly userRepository: UserRepository,
  ) {}

  async createUser(input: CreateUserInput): Promise<void> {
    const { name, email, password } = input;

    // 入力値検証
    if (!name || !email || !password) {
      throw new InvalidInputError("必要な情報が不足しています");
    }

    if (name.trim().length === 0) {
      throw new InvalidInputError("名前を入力してください");
    }

    if (email.trim().length === 0) {
      throw new InvalidInputError("メールアドレスを入力してください");
    }

    if (password.length < 6) {
      throw new InvalidInputError("パスワードは6文字以上で入力してください");
    }

    await this.userRepository.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
  }

  async getUserByEmail(email: string) {
    if (!email || email.trim().length === 0) {
      throw new InvalidInputError("メールアドレスを入力してください");
    }

    return await this.userRepository.getUserByEmail(email.trim().toLowerCase());
  }

  async getUserByIdWithAvatar(userId: string): Promise<UserWithAvatar> {
    if (!userId || userId.trim().length === 0) {
      throw new InvalidInputError("ユーザーIDが必要です");
    }

    return await this.userRepository.getUserByIdWithAvatar(userId);
  }

  async hasAvatar(userId: string): Promise<boolean> {
    if (!userId || userId.trim().length === 0) {
      throw new InvalidInputError("ユーザーIDが必要です");
    }

    return await this.userRepository.hasAvatar(userId);
  }

  async getSelfAvatar(userId: string) {
    if (!userId || userId.trim().length === 0) {
      throw new InvalidInputError("ユーザーIDが必要です");
    }

    const user = await this.userRepository.getUserByIdWithAvatar(userId);
    return user.selfAvatar;
  }
}
