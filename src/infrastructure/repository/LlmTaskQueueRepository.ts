import type { LlmTaskQueue, QueueState } from "@/generated/client";
import type { LlmTaskQueueRepository } from "../../domain/llmTaskQueue/repository";
import { inject, injectable } from "tsyringe";
import { type DBClient } from "./util";
import { DI } from "../../server/di.type";

@injectable()
export class LlmTaskQueueRepositoryImpl implements LlmTaskQueueRepository {
  constructor(@inject(DI.PrismaClient) private prisma: DBClient) {}
  async enqueueTask(params: {
    avatarId: string;
    prompt: string;
    context?: PrismaJson.LLMContext;
    botTaskQueueId?: string;
  }): Promise<LlmTaskQueue> {
    return await this.prisma.llmTaskQueue.create({
      data: {
        avatarId: params.avatarId,
        prompt: params.prompt,
        context: params.context,
        botTaskQueueId: params.botTaskQueueId,
      },
    });
  }

  async getPendingTasks(limit = 10): Promise<LlmTaskQueue[]> {
    return await this.prisma.llmTaskQueue.findMany({
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
    await this.prisma.llmTaskQueue.update({
      where: { id },
      data: {
        status: status,
        updatedAt: new Date(),
      },
    });
  }

  async getProcessingCount(): Promise<number> {
    return await this.prisma.llmTaskQueue.count({
      where: {
        status: "PROCESSING",
      },
    });
  }

  async updateTaskContext(id: string, context: PrismaJson.LLMContext): Promise<void> {
    await this.prisma.llmTaskQueue.update({
      where: { id },
      data: {
        context: context,
        updatedAt: new Date(),
      },
    });
  }
}
