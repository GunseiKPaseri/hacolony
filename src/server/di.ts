import "reflect-metadata";
import { container } from "tsyringe";

// Services
import { BotReplyService } from "./services/botReplyService";
import { UserService } from "./services/userService";
import { AvatarService } from "./services/avatarService";
import { PostService } from "./services/postService";
import { BotTaskWorker } from "./worker/botTaskWorker";
import { LlmTaskWorker } from "./worker/llmTaskWorker";
import { PostQueueWorker } from "./worker/postQueueWorker";
import { OllamaClient } from "./client/OllamaClient";
import { Scheduler } from "./worker/scheduler";

import { prisma } from "./prisma/prisma";
import { DI } from "./di.type";
import { DIRegistRepository } from "./repository/diRegist";
import { DBTransaction } from "./repository/util";

// db implementations
container.registerInstance(DI.Prisma, prisma);
container.registerInstance(DI.PrismaClient, prisma);
container.registerInstance(DI.OllamaClient, new OllamaClient());

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

container.resolve<Scheduler>(DI.Scheduler).start()

export { container };
