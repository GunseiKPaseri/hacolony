import { BotConfigRepository } from "./interface";
import { type DBClient } from "./util";

export default class DBBotConfigRepository implements BotConfigRepository {
  constructor(private prisma: DBClient) {}

  async createBotConfig(props: {avatarId: string, prompt: string}) {
    const { avatarId, prompt } = props;

    const botConfig = await this.prisma.botConfig.create({
      data: {
        prompt,
        avatarId,
      },
    });

    return botConfig;
  }
}