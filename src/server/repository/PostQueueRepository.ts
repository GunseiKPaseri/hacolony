import type { PostQueue } from "@/generated/client";
import type { PostQueueRepository } from "./interface";
import { inject, injectable } from "tsyringe";
import { type DBClient } from "./util";
import { DI } from "../di.type";

@injectable()
export class PostQueueRepositoryImpl implements PostQueueRepository {
  constructor(@inject(DI.PrismaClient) private prisma: DBClient) {}
  async schedulePost(params: {
    avatarId: string;
    content: string;
    scheduledAt: Date;
    context?: PrismaJson.PostQueueContext;
    replyToId?: string;
    botTaskQueueId?: string;
  }): Promise<PostQueue> {
    return await this.prisma.postQueue.create({
      data: {
        avatarId: params.avatarId,
        content: params.content,
        scheduledAt: params.scheduledAt,
        context: params.context,
        replyToId: params.replyToId,
        botTaskQueueId: params.botTaskQueueId,
      },
    });
  }

  async getDuePosts(limit = 10): Promise<PostQueue[]> {
    return await this.prisma.postQueue.findMany({
      where: {
        status: "PENDING",
        scheduledAt: {
          lte: new Date(),
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
      take: limit,
      include: {
        avatar: true,
        replyTo: true,
      },
    });
  }

  async updatePostContext(id: string, context: PrismaJson.PostQueueContext): Promise<void> {
    await this.prisma.postQueue.update({
      where: { id },
      data: {
        context: context,
        updatedAt: new Date(),
      },
    });
  }

  async markPostAsProcessed(id: string): Promise<void> {
    await this.prisma.postQueue.update({
      where: { id },
      data: {
        status: "COMPLETED",
        updatedAt: new Date(),
      },
    });
  }

  async getProcessingCount(): Promise<number> {
    return await this.prisma.postQueue.count({
      where: {
        status: "PROCESSING",
      },
    });
  }

  async getPostById(id: string): Promise<PostQueue | null> {
    return await this.prisma.postQueue.findUnique({
      where: { id },
    });
  }
}
