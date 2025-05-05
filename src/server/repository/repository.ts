import { prisma } from "../prisma/prisma";
import type { AvatarRepository, BotConfigRepository, FollowRepository, PostRepository, UserRepository } from "./interface";
import DBAvatarRepository from "./AvatarRepository";
import DBBotConfigRepository from "./BotConfigRepository";
import DBFollowRepository from "./FollowRepository";
import DBPostRepository from "./PostRepository";
import DBUserRepository from "./UserRepository";

export const dbAvatarRepository: AvatarRepository = new DBAvatarRepository(prisma);
export const dbBotConfigRepository: BotConfigRepository = new DBBotConfigRepository(prisma);
export const dbFollowRepository: FollowRepository = new DBFollowRepository(prisma);
export const dbPostRepository: PostRepository = new DBPostRepository(prisma);
export const dbUserRepository: UserRepository = new DBUserRepository(prisma);

type Repositories = {
  txAvatarRepository: AvatarRepository;
  txBotConfigRepository: BotConfigRepository;
  txFollowRepository: FollowRepository;
  txPostRepository: PostRepository;
  txUserRepository: UserRepository;
}

type CallBack<T> = (repositories: Repositories) => Promise<T>;

export const transaction = async <T>(callback: CallBack<T>) =>
  prisma.$transaction(async (tx) => {
    const txAvatarRepository = new DBAvatarRepository(tx);
    const txBotConfigRepository = new DBBotConfigRepository(tx);
    const txFollowRepository = new DBFollowRepository(tx);
    const txPostRepository = new DBPostRepository(tx);
    const txUserRepository = new DBUserRepository(tx);

    return callback({
      txAvatarRepository,
      txBotConfigRepository,
      txFollowRepository,
      txPostRepository,
      txUserRepository,
    });
  });
