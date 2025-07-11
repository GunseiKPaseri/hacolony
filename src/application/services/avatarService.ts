import { inject, injectable } from "tsyringe";
import type { AvatarRepository } from "../../domain/avatar/repository";
import type { BotConfigRepository } from "../../domain/botConfig/repository";
import type { FollowRepository } from "../../domain/follow/repository";
import type { UserRepository } from "../../domain/user/repository";
import { DI } from "../../server/di.type";
import { DBTransaction, InvalidInputError, NotFoundError } from "../../infrastructure/repository/util";

export interface CreateAvatarInput {
  name: string;
  description?: string;
  imageUrl?: string;
  userId: string;
  hidden?: boolean;
}

export interface CreateSelfAvatarInput {
  name: string;
  description?: string;
  imageUrl?: string;
  userId: string;
}

export interface CreateAIAvatarInput {
  name: string;
  description?: string;
  imageUrl?: string;
  prompt: string;
  userId: string;
}

@injectable()
export class AvatarService {
  constructor(
    @inject(DI.Transaction) private readonly transaction: DBTransaction,
    @inject(DI.AvatarRepository) private readonly avatarRepository: AvatarRepository,
    @inject(DI.BotConfigRepository) private readonly botConfigRepository: BotConfigRepository,
    @inject(DI.FollowRepository) private readonly followRepository: FollowRepository,
    @inject(DI.UserRepository) private readonly userRepository: UserRepository,
  ) {}

  async getAvatarsByUserId(userId: string) {
    if (!userId || userId.trim().length === 0) {
      throw new InvalidInputError("ユーザーIDが必要です");
    }

    return await this.avatarRepository.getAvatarsByUserId(userId);
  }

  async createAvatar(input: CreateAvatarInput) {
    const { name, description, imageUrl, userId, hidden = true } = input;

    // 入力値検証
    if (!name || name.trim().length === 0) {
      throw new InvalidInputError("アバター名を入力してください");
    }

    if (!userId || userId.trim().length === 0) {
      throw new InvalidInputError("ユーザーIDが必要です");
    }

    return await this.avatarRepository.createAvatar({
      name: name.trim(),
      description: description?.trim() || undefined,
      imageUrl: imageUrl?.trim() || undefined,
      userId,
      hidden,
    });
  }

  async createSelfAvatar(input: CreateSelfAvatarInput) {
    const { name, description, imageUrl, userId } = input;

    // 入力値検証
    if (!name || name.trim().length === 0) {
      throw new InvalidInputError("アバター名を入力してください");
    }

    if (!userId || userId.trim().length === 0) {
      throw new InvalidInputError("ユーザーIDが必要です");
    }

    // 既にアバターが存在するかチェック
    if (await this.userRepository.hasAvatar(userId)) {
      throw new InvalidInputError("アバターは既に存在します");
    }

    return await this.transaction.runWithRepository(async ({ AvatarRepository, UserRepository }) => {
      // アバター作成
      const avatar = await AvatarRepository.createAvatar({
        name: name.trim(),
        description: description?.trim() || undefined,
        imageUrl: imageUrl?.trim() || undefined,
        userId,
        hidden: true,
      });

      // 自己アバターを登録
      await UserRepository.addSelfAvatar(userId, avatar.id);

      return avatar;
    });
  }

  async createAIAvatar(input: CreateAIAvatarInput) {
    const { name, description, imageUrl, prompt, userId } = input;

    // 入力値検証
    if (!name || name.trim().length === 0) {
      throw new InvalidInputError("アバター名を入力してください");
    }

    if (!prompt || prompt.trim().length === 0) {
      throw new InvalidInputError("プロンプトを入力してください");
    }

    if (!userId || userId.trim().length === 0) {
      throw new InvalidInputError("ユーザーIDが必要です");
    }

    return await this.transaction.runWithRepository(
      async ({ AvatarRepository, BotConfigRepository, FollowRepository, UserRepository }) => {
        // アバター名の重複チェック
        const existingAvatar = await AvatarRepository.isExistAvatarByName(name, userId);
        if (existingAvatar) {
          throw new InvalidInputError("この名前のアバターは既に存在します");
        }

        // ユーザーの自己アバターを取得
        const selfAvatar = await UserRepository.getSelfAvatar(userId);
        if (!selfAvatar) {
          throw new NotFoundError("自己アバターが見つかりません");
        }

        // AIアバターを作成
        const avatar = await AvatarRepository.createAvatar({
          name: name.trim(),
          description: description?.trim() || undefined,
          imageUrl: imageUrl?.trim() || undefined,
          userId,
          hidden: true,
        });

        // BotConfigを作成
        await BotConfigRepository.createBotConfig({
          prompt: prompt.trim(),
          avatarId: avatar.id,
        });

        // フォロー関係を作成
        await FollowRepository.followAvatar([
          { followerId: avatar.id, followeeId: selfAvatar.id },
          { followerId: selfAvatar.id, followeeId: avatar.id },
        ]);

        return avatar;
      },
    );
  }

  async getAvatarById(avatarId: string) {
    if (!avatarId || avatarId.trim().length === 0) {
      throw new InvalidInputError("アバターIDが必要です");
    }

    const avatar = await this.avatarRepository.getAvatarById(avatarId);
    return avatar; // nullの場合はnullを返す（呼び出し側で判定）
  }

  async updateAvatar(
    avatarId: string,
    props: {
      name?: string;
      description?: string;
      imageUrl?: string;
      hidden?: boolean;
    },
  ) {
    if (!avatarId || avatarId.trim().length === 0) {
      throw new InvalidInputError("アバターIDが必要です");
    }

    // 名前の重複チェック（名前が変更される場合）
    if (props.name) {
      const existingAvatar = await this.avatarRepository.getAvatarById(avatarId);
      if (!existingAvatar) {
        return null; // アバターが見つからない場合はnullを返す
      }

      if (props.name !== existingAvatar.name) {
        const isDuplicate = await this.avatarRepository.isExistAvatarByName(props.name, existingAvatar.ownerId);
        if (isDuplicate) {
          throw new InvalidInputError("この名前のアバターは既に存在します");
        }
      }
    }

    return await this.avatarRepository.updateAvatar(avatarId, props);
  }
}
