import type { BotTaskQueue, QueueState } from "@/generated/client";
import type { BotTaskQueueRepository } from "../../domain/botTaskQueue/repository";
import { inject, injectable } from "tsyringe";
import { type DBClient } from "./util";
import { DI } from "../../server/di.type";

@injectable()
export class BotTaskQueueRepositoryImpl implements BotTaskQueueRepository {
  constructor(@inject(DI.PrismaClient) private prisma: DBClient) {}

  async enqueueTask(params: { avatarId: string; task: PrismaJson.TaskContext }): Promise<BotTaskQueue> {
    return await this.prisma.botTaskQueue.create({
      data: {
        avatarId: params.avatarId,
        task: params.task,
      },
    });
  }

  async getPendingTasks(limit = 10): Promise<BotTaskQueue[]> {
    return await this.prisma.botTaskQueue.findMany({
      where: {
        status: "PENDING",
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: limit,
      include: {
        avatar: {
          include: {
            botConfig: true,
          },
        },
      },
    });
  }

  async updateTaskStatus(id: string, status: QueueState): Promise<void> {
    await this.prisma.botTaskQueue.update({
      where: { id },
      data: {
        status: status,
        updatedAt: new Date(),
      },
    });
  }

  async updateTaskContext(id: string, taskContext: PrismaJson.TaskContext): Promise<void> {
    await this.prisma.botTaskQueue.update({
      where: { id },
      data: {
        task: taskContext,
        updatedAt: new Date(),
      },
    });
  }

  async getProcessingCount(): Promise<number> {
    return await this.prisma.botTaskQueue.count({
      where: {
        status: "PROCESSING",
      },
    });
  }

  async getTaskById(id: string): Promise<BotTaskQueue | null> {
    return await this.prisma.botTaskQueue.findUnique({
      where: { id },
      include: {
        avatar: {
          include: {
            botConfig: true,
          },
        },
      },
    });
  }
}
