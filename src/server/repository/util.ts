import { container, inject, injectable } from "tsyringe";
import { prisma } from "../prisma/prisma";
import { DI } from "../di.type";
import { PrismaClient } from "@/generated/client";
import { DIRegistRepository, Repositories } from "./diRegist";
export type DBClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export class NotFoundError extends Error {
  static {
    this.prototype.name = "NotFoundError";
  }
}

export class InvalidInputError extends Error {
  static {
    this.prototype.name = "InvalidInputError";
  }
}

@injectable()
export class DBTransaction {
  constructor(@inject(DI.Prisma) private readonly prisma: PrismaClient) {}

  async runWithRepository<T>(callback: (container: Repositories) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const childConainer = container.createChildContainer();
      childConainer.register(DI.PrismaClient, { useValue: tx });
      DIRegistRepository(childConainer);
      const repositories = {
        AvatarRepository: childConainer.resolve<Repositories["AvatarRepository"]>(DI.AvatarRepository),
        BotConfigRepository: childConainer.resolve<Repositories["BotConfigRepository"]>(DI.BotConfigRepository),
        BotTaskQueueRepository: childConainer.resolve<Repositories["BotTaskQueueRepository"]>(DI.BotTaskQueueRepository),
        FollowRepository: childConainer.resolve<Repositories["FollowRepository"]>(DI.FollowRepository),
        LlmTaskQueueRepository: childConainer.resolve<Repositories["LlmTaskQueueRepository"]>(DI.LlmTaskQueueRepository),
        PostQueueRepository: childConainer.resolve<Repositories["PostQueueRepository"]>(DI.PostQueueRepository),
        PostRepository: childConainer.resolve<Repositories["PostRepository"]>(DI.PostRepository),
        UserRepository: childConainer.resolve<Repositories["UserRepository"]>(DI.UserRepository),
      }
      return callback(repositories);
    });
  }
}
