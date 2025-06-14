export interface BotConfigRepository {
  createBotConfig(props: { avatarId: string; prompt: string }): Promise<{ id: string; prompt: string }>;
  getBotConfigByAvatarId(avatarId: string): Promise<{ id: string; prompt: string } | null>;
  updateBotConfig(avatarId: string, prompt: string): Promise<{ id: string; prompt: string }>;
}
