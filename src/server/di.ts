import "reflect-metadata";
import { container } from "tsyringe";

// Services
import { BotReplyService } from "../application/services/botReplyService";
import { UserService } from "../application/services/userService";
import { AvatarService } from "../application/services/avatarService";
import { PostService } from "../application/services/postService";
import { BotTaskWorker } from "../infrastructure/worker/botTaskWorker";
import { LlmTaskWorker } from "../infrastructure/worker/llmTaskWorker";
import { PostQueueWorker } from "../infrastructure/worker/postQueueWorker";
import { OllamaClient } from "../infrastructure/client/OllamaClient";
import { Scheduler } from "../infrastructure/worker/scheduler";
import { logger } from "../utils/logger";

import { prisma } from "../infrastructure/prisma/prisma";
import { DI } from "./di.type";
import { DIRegistRepository } from "../infrastructure/repository/diRegist";
import { DBTransaction } from "../infrastructure/repository/util";

// db implementations
container.registerInstance(DI.Prisma, prisma);
container.registerInstance(DI.PrismaClient, prisma);
container.registerInstance(DI.OllamaClient, new OllamaClient());
container.registerInstance(DI.Logger, logger);

container.registerSingleton(DI.Transaction, DBTransaction);

// Register repository implementations
DIRegistRepository(container);

// Register services
container.registerSingleton(DI.BotReplyService, BotReplyService);
container.registerSingleton(DI.UserService, UserService);
container.registerSingleton(DI.AvatarService, AvatarService);
container.registerSingleton(DI.PostService, PostService);
container.registerSingleton(DI.BotTaskWorker, BotTaskWorker);
container.registerSingleton(DI.LlmTaskWorker, LlmTaskWorker);
container.registerSingleton(DI.PostQueueWorker, PostQueueWorker);
container.registerSingleton(DI.Scheduler, Scheduler);

// Start scheduler asynchronously
(async () => {
  try {
    const scheduler = container.resolve<Scheduler>(DI.Scheduler);
    await scheduler.start();
  } catch (error) {
    logger.error("Failed to start scheduler:", error);
  }
})();

export { container };
