import type { BotTaskQueueRepository } from "../repository/interface";

/**
 * Queue間の状態管理を行うヘルパークラス
 * 外部処理待機状態とタスクキュー待ち状態を管理
 */
export class QueueStatusManager {
  /**
   * LLMタスクが完了したときにBotTaskQueueのstatusをQUEUE_WAITINGに変更
   */
  static async notifyLLMTaskCompleted(botTaskQueueRepo: BotTaskQueueRepository, botTaskQueueId: string): Promise<void> {
    // BotTaskQueueのステータスをPENDINGに戻す（タスクキュー待ち状態）
    await botTaskQueueRepo.updateTaskStatus(botTaskQueueId, "PENDING");
  }

  /**
   * LLMタスクが失敗したときにBotTaskQueueのstatusをFAILEDに変更
   */
  static async notifyLLMTaskFailed(botTaskQueueRepo: BotTaskQueueRepository, botTaskQueueId: string): Promise<void> {
    await botTaskQueueRepo.updateTaskStatus(botTaskQueueId, "FAILED");
  }

  /**
   * PostQueueタスクが完了したときにBotTaskQueueのstatusをCOMPLETEDに変更
   */
  static async notifyPostQueueCompleted(
    botTaskQueueRepo: BotTaskQueueRepository,
    botTaskQueueId: string,
  ): Promise<void> {
    await botTaskQueueRepo.updateTaskStatus(botTaskQueueId, "COMPLETED");
  }

  /**
   * PostQueueタスクが失敗したときにBotTaskQueueのstatusをFAILEDに変更
   */
  static async notifyPostQueueFailed(botTaskQueueRepo: BotTaskQueueRepository, botTaskQueueId: string): Promise<void> {
    await botTaskQueueRepo.updateTaskStatus(botTaskQueueId, "FAILED");
  }

  /**
   * BotTaskがLLMキューに投入されたときに外部処理待機状態に設定
   */
  static async setBotTaskWaitingForLLM(
    _botTaskQueueRepo: BotTaskQueueRepository,
    _botTaskQueueId: string,
  ): Promise<void> {
    // 外部処理待機状態としてPROCESSINGのまま維持
    // コンテキストで詳細な状態を管理
  }

  /**
   * BotTaskがPostQueueに投入されたときに外部処理待機状態に設定
   */
  static async setBotTaskWaitingForPost(
    _botTaskQueueRepo: BotTaskQueueRepository,
    _botTaskQueueId: string,
  ): Promise<void> {
    // 外部処理待機状態としてPROCESSINGのまま維持
    // コンテキストで詳細な状態を管理
  }
}
