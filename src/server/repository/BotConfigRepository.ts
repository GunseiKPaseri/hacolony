import { inject, injectable } from "tsyringe";
import type { BotConfigRepository } from "./interface";
import { type DBClient } from "./util";
import { DI } from "../di.type";

@injectable()
export class BotConfigRepositoryImpl implements BotConfigRepository {
  constructor(@inject(DI.PrismaClient) private prisma: DBClient) {}

  async createBotConfig(props: { avatarId: string; prompt: string }) {
    const { avatarId, prompt } = props;

    const botConfig = await this.prisma.botConfig.create({
      data: {
        prompt,
        avatarId,
      },
    });

    return botConfig;
  }

  async getBotConfigByAvatarId(avatarId: string): Promise<{ id: string; prompt: string } | null> {
    const botConfig = await this.prisma.botConfig.findUnique({
      where: {
        avatarId,
      },
      select: {
        id: true,
        prompt: true,
      },
    });

    return botConfig;
  }

  async updateBotConfig(avatarId: string, prompt: string): Promise<{ id: string; prompt: string }> {
    const botConfig = await this.prisma.botConfig.update({
      where: {
        avatarId,
      },
      data: {
        prompt,
      },
      select: {
        id: true,
        prompt: true,
      },
    });

    return botConfig;
  }
}
