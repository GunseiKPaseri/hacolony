import { DependencyContainer } from "tsyringe";
import { DI } from "../../server/di.type";
import type { AvatarRepository } from "../../domain/avatar/repository";
import type { BotConfigRepository } from "../../domain/botConfig/repository";
import type { BotTaskQueueRepository } from "../../domain/botTaskQueue/repository";
import type { FollowRepository } from "../../domain/follow/repository";
import type { LlmTaskQueueRepository } from "../../domain/llmTaskQueue/repository";
import type { PostQueueRepository } from "../../domain/postQueue/repository";
import type { PostRepository } from "../../domain/post/repository";
import type { UserRepository } from "../../domain/user/repository";

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
