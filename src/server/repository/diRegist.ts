import { DependencyContainer } from "tsyringe";
import { DI } from "../di.type";
import type {
  LlmTaskQueueRepository,
  BotTaskQueueRepository,
  BotConfigRepository,
  FollowRepository,
  PostQueueRepository,
  PostRepository,
  AvatarRepository,
  UserRepository,
} from "./interface";

import { AvatarRepositoryImpl } from "./AvatarRepository";
import { BotConfigRepositoryImpl } from "./BotConfigRepository";
import { BotTaskQueueRepositoryImpl } from "./BotTaskQueueRepository";
import { FollowRepositoryImpl } from "./FollowRepository";
import { LlmTaskQueueRepositoryImpl } from "./LlmTaskQueueRepository";
import { PostQueueRepositoryImpl } from "./PostQueueRepository";
import { PostRepositoryImpl } from "./PostRepository";
import { UserRepositoryImpl } from "./UserRepository";

export function DIRegistRepository(container: DependencyContainer) {
  container.registerSingleton<AvatarRepository>(DI.AvatarRepository, AvatarRepositoryImpl);
  container.registerSingleton<BotConfigRepository>(DI.BotConfigRepository, BotConfigRepositoryImpl);
  container.registerSingleton<BotTaskQueueRepository>(DI.BotTaskQueueRepository, BotTaskQueueRepositoryImpl);
  container.registerSingleton<FollowRepository>(DI.FollowRepository, FollowRepositoryImpl);
  container.registerSingleton<LlmTaskQueueRepository>(DI.LlmTaskQueueRepository, LlmTaskQueueRepositoryImpl);
  container.registerSingleton<PostQueueRepository>(DI.PostQueueRepository, PostQueueRepositoryImpl);
  container.registerSingleton<PostRepository>(DI.PostRepository, PostRepositoryImpl);
  container.registerSingleton<UserRepository>(DI.UserRepository, UserRepositoryImpl);
  return container;
}

export type Repositories = {
  AvatarRepository: AvatarRepository;
  BotConfigRepository: BotConfigRepository;
  BotTaskQueueRepository: BotTaskQueueRepository;
  FollowRepository: FollowRepository;
  LlmTaskQueueRepository: LlmTaskQueueRepository;
  PostQueueRepository: PostQueueRepository;
  PostRepository: PostRepository;
  UserRepository: UserRepository;
};
