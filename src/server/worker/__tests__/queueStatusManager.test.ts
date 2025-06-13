import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueueStatusManager } from "../queueStatusManager";
import type { BotTaskQueueRepository } from "../../repository/interface";

describe("QueueStatusManager", () => {
  let mockBotTaskQueueRepo: BotTaskQueueRepository;

  beforeEach(() => {
    mockBotTaskQueueRepo = {
      updateTaskStatus: vi.fn(),
      enqueueTask: vi.fn(),
      getPendingTasks: vi.fn(),
      getProcessingCount: vi.fn(),
      updateTaskContext: vi.fn(),
      getTaskById: vi.fn(),
    };
  });

  describe("notifyLLMTaskCompleted", () => {
    it("should set BotTaskQueue status to PENDING when LLM task is completed", async () => {
      const botTaskQueueId = "bot-task-123";

      await QueueStatusManager.notifyLLMTaskCompleted(mockBotTaskQueueRepo, botTaskQueueId);

      expect(mockBotTaskQueueRepo.updateTaskStatus).toHaveBeenCalledWith(botTaskQueueId, "PENDING");
    });
  });

  describe("notifyLLMTaskFailed", () => {
    it("should set BotTaskQueue status to FAILED when LLM task fails", async () => {
      const botTaskQueueId = "bot-task-123";

      await QueueStatusManager.notifyLLMTaskFailed(mockBotTaskQueueRepo, botTaskQueueId);

      expect(mockBotTaskQueueRepo.updateTaskStatus).toHaveBeenCalledWith(botTaskQueueId, "FAILED");
    });
  });

  describe("notifyPostQueueCompleted", () => {
    it("should set BotTaskQueue status to COMPLETED when PostQueue task is completed", async () => {
      const botTaskQueueId = "bot-task-123";

      await QueueStatusManager.notifyPostQueueCompleted(mockBotTaskQueueRepo, botTaskQueueId);

      expect(mockBotTaskQueueRepo.updateTaskStatus).toHaveBeenCalledWith(botTaskQueueId, "COMPLETED");
    });
  });

  describe("notifyPostQueueFailed", () => {
    it("should set BotTaskQueue status to FAILED when PostQueue task fails", async () => {
      const botTaskQueueId = "bot-task-123";

      await QueueStatusManager.notifyPostQueueFailed(mockBotTaskQueueRepo, botTaskQueueId);

      expect(mockBotTaskQueueRepo.updateTaskStatus).toHaveBeenCalledWith(botTaskQueueId, "FAILED");
    });
  });

  describe("setBotTaskWaitingForLLM", () => {
    it("should maintain PROCESSING status for external waiting", async () => {
      const botTaskQueueId = "bot-task-123";

      await QueueStatusManager.setBotTaskWaitingForLLM(mockBotTaskQueueRepo, botTaskQueueId);

      // 外部処理待機状態では特別な処理は行わない（PROCESSINGのまま）
      expect(mockBotTaskQueueRepo.updateTaskStatus).not.toHaveBeenCalled();
    });
  });

  describe("setBotTaskWaitingForPost", () => {
    it("should maintain PROCESSING status for external waiting", async () => {
      const botTaskQueueId = "bot-task-123";

      await QueueStatusManager.setBotTaskWaitingForPost(mockBotTaskQueueRepo, botTaskQueueId);

      // 外部処理待機状態では特別な処理は行わない（PROCESSINGのまま）
      expect(mockBotTaskQueueRepo.updateTaskStatus).not.toHaveBeenCalled();
    });
  });
});
