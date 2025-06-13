import { inject, injectable } from "tsyringe";
import type { UserRepository, AvatarRepository } from "../repository/interface";
import { DI } from "../di.type";
import { InvalidInputError } from "../repository/util";
import { DBTransaction } from "../repository/util";
import type { Logger } from "pino";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  avatar: {
    name: string;
    description?: string;
    imageUrl?: string;
  };
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
    @inject(DI.AvatarRepository) private readonly avatarRepository: AvatarRepository,
    @inject(DI.UserRepository) private readonly userRepository: UserRepository,
    @inject(DI.Transaction) private readonly transaction: DBTransaction,
    @inject(DI.Logger) private readonly logger: Logger,
  ) {}

  async createUser(input: CreateUserInput): Promise<void> {
    const { name, email, password, avatar } = input;

    // 入力値検証
    if (!name || !email || !password || !avatar) {
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

    if (!avatar.name || avatar.name.trim().length === 0) {
      throw new InvalidInputError("アバター名を入力してください");
    }

    this.logger.info({ name: name.trim(), email: email.trim().toLowerCase() }, "Creating user with self avatar");

    // トランザクション内でユーザーとSelfAvatarを同時作成
    await this.transaction.runWithRepository(async ({ UserRepository, AvatarRepository }) => {
      // アバター情報を準備
      const avatarData = {
        name: avatar.name.trim(),
        description: avatar.description?.trim() || `${name.trim()}のアバター`,
        imageUrl: avatar.imageUrl?.trim() || undefined,
        hidden: true,
      };

      // まずユーザーをアバター無しで作成
      const user = await UserRepository.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      this.logger.info({ userId: user.id, avatarName: avatarData.name }, "User created, creating self avatar");

      // SelfAvatar作成
      const createdAvatar = await AvatarRepository.createAvatar({
        ...avatarData,
        userId: user.id,
      });

      this.logger.info({ userId: user.id, avatarId: createdAvatar.id }, "Self avatar created");

      // ユーザーにSelfAvatarを設定
      await UserRepository.addSelfAvatar(user.id, createdAvatar.id);

      this.logger.info({ userId: user.id, avatarId: createdAvatar.id }, "Self avatar linked to user");
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
    if (!user.selfAvatar) {
      throw new InvalidInputError("セルフアバターが見つかりません");
    }
    return user.selfAvatar;
  }

  async ensureSelfAvatar(
    userId: string,
    avatarInfo?: { name?: string; description?: string; imageUrl?: string },
  ): Promise<void> {
    if (!userId || userId.trim().length === 0) {
      throw new InvalidInputError("ユーザーIDが必要です");
    }

    // 既にSelfAvatarが存在するかチェック
    if (await this.userRepository.hasAvatar(userId)) {
      this.logger.debug({ userId }, "User already has self avatar");
      return;
    }

    this.logger.info({ userId }, "Creating missing self avatar for existing user");

    // ユーザー情報を取得
    const user = await this.userRepository.getUserByIdWithAvatar(userId);
    if (!user) {
      throw new InvalidInputError("ユーザーが見つかりません");
    }

    // トランザクション内でSelfAvatarを作成
    await this.transaction.runWithRepository(async ({ UserRepository, AvatarRepository }) => {
      // アバター情報を準備（引数またはデフォルト値）
      const avatarData = {
        name: avatarInfo?.name?.trim() || user.name,
        description: avatarInfo?.description?.trim() || `${user.name}のアバター`,
        imageUrl: avatarInfo?.imageUrl?.trim() || undefined,
        userId: user.id,
        hidden: true,
      };

      // SelfAvatar作成
      const avatar = await AvatarRepository.createAvatar(avatarData);

      this.logger.info({ userId: user.id, avatarId: avatar.id }, "Self avatar created for existing user");

      // ユーザーにSelfAvatarを設定
      await UserRepository.addSelfAvatar(user.id, avatar.id);

      this.logger.info({ userId: user.id, avatarId: avatar.id }, "Self avatar linked to existing user");
    });
  }
}
