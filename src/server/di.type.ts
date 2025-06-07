export const DI = {
  Prisma: Symbol.for("Prisma"),
  PrismaClient: Symbol.for("PrismaClient"),
  OllamaClient: Symbol.for("OllamaClient"),

  Transaction: Symbol.for("Transaction"),

  AvatarRepository: Symbol.for("AvatarRepository"),
  BotConfigRepository: Symbol.for("BotConfigRepository"),
  BotTaskQueueRepository: Symbol.for("BotTaskQueueRepository"),
  FollowRepository: Symbol.for("FollowRepository"),
  LlmTaskQueueRepository: Symbol.for("LlmTaskQueueRepository"),
  PostQueueRepository: Symbol.for("PostQueueRepository"),
  PostRepository: Symbol.for("PostRepository"),
  UserRepository: Symbol.for("UserRepository"),

  // Services
  BotReplyService: Symbol.for("BotReplyService"),
  UserService: Symbol.for("UserService"),
  AvatarService: Symbol.for("AvatarService"),
  PostService: Symbol.for("PostService"),

  BotTaskWorker: Symbol.for("BotTaskWorker"),
  LlmTaskWorker: Symbol.for("LlmTaskWorker"),
  PostQueueWorker: Symbol.for("PostQueueWorker"),
  Scheduler: Symbol.for("Scheduler"),
};
