import { describe, it, expect, vi, beforeEach } from "vitest";
import { BotTaskWorker } from "../botTaskWorker";
import type { Logger } from "pino";
import type {
  BotTaskQueueRepository,
  LlmTaskQueueRepository,
  BotConfigRepository,
  PostRepository,
} from "../../repository/interface";
import type { BotTaskQueue, LlmTaskQueue, Post } from "@/generated/client";

// Mock QueueStatusManager
vi.mock("../queueStatusManager", () => ({
  QueueStatusManager: {
    setBotTaskWaitingForLLM: vi.fn(),
  },
}));

describe("BotTaskWorker", () => {
  let botTaskWorker: BotTaskWorker;
  let mockLogger: Logger;
  let mockBotConfigRepo: BotConfigRepository;
  let mockBotTaskQueueRepo: BotTaskQueueRepository;
  let mockLlmTaskQueueRepo: LlmTaskQueueRepository;
  let mockPostRepo: PostRepository;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      fatal: vi.fn(),
      silent: vi.fn(),
      level: "info" as const,
      child: vi.fn(() => mockLogger),
    } as unknown as Logger;

    mockBotConfigRepo = {
      getBotConfigByAvatarId: vi.fn().mockResolvedValue(null),
      createBotConfig: vi.fn().mockResolvedValue({}),
      updateBotConfig: vi.fn().mockResolvedValue({}),
    };

    mockBotTaskQueueRepo = {
      getPendingTasks: vi.fn().mockResolvedValue([]),
      getProcessingCount: vi.fn().mockResolvedValue(0),
      updateTaskStatus: vi.fn().mockResolvedValue(undefined),
      updateTaskContext: vi.fn().mockResolvedValue(undefined),
      enqueueTask: vi.fn().mockResolvedValue({}),
      getTaskById: vi.fn().mockResolvedValue(null),
    };

    mockLlmTaskQueueRepo = {
      enqueueTask: vi.fn().mockResolvedValue({}),
      getPendingTasks: vi.fn().mockResolvedValue([]),
      getProcessingCount: vi.fn().mockResolvedValue(0),
      updateTaskStatus: vi.fn().mockResolvedValue(undefined),
      updateTaskContext: vi.fn().mockResolvedValue(undefined),
    };

    mockPostRepo = {
      getPostById: vi.fn().mockResolvedValue(null),
      createPostByAvatarId: vi.fn().mockResolvedValue({}),
      createPostByUserId: vi.fn().mockResolvedValue({}),
      getPostsByUserId: vi.fn().mockResolvedValue([]),
      getTimelinePostsByUserId: vi.fn().mockResolvedValue([]),
    };

    botTaskWorker = new BotTaskWorker(
      mockLogger,
      mockBotConfigRepo,
      mockBotTaskQueueRepo,
      mockLlmTaskQueueRepo,
      mockPostRepo,
    );
  });

  describe("processTasks", () => {
    it("should process random_post task correctly", async () => {
      const mockTask = {
        id: "task-123",
        avatarId: "avatar-123",
        task: {
          type: "random_post",
        } as PrismaJson.TaskContext,
      } as unknown as BotTaskQueue;

      const mockBotConfig = {
        id: "config-123",
        prompt: "Test bot prompt",
      };

      const mockLlmTask = {
        id: "llm-task-123",
      } as unknown as LlmTaskQueue;

      vi.mocked(mockBotTaskQueueRepo.getPendingTasks).mockResolvedValue([mockTask]);
      vi.mocked(mockBotConfigRepo.getBotConfigByAvatarId).mockResolvedValue(mockBotConfig);
      vi.mocked(mockLlmTaskQueueRepo.enqueueTask).mockResolvedValue(mockLlmTask);

      await botTaskWorker.processTasks();

      expect(mockBotTaskQueueRepo.updateTaskStatus).toHaveBeenCalledWith("task-123", "PROCESSING");
      expect(mockBotTaskQueueRepo.updateTaskContext).toHaveBeenCalledWith("task-123", {
        type: "random_post",
        status: "CREATED",
      });
      expect(mockLlmTaskQueueRepo.enqueueTask).toHaveBeenCalledWith({
        avatarId: "avatar-123",
        prompt: expect.stringContaining("Test bot prompt"),
        botTaskQueueId: "task-123",
        context: {
          status: "WAITING",
          prompt: expect.stringContaining("Test bot prompt"),
        },
      });
      expect(mockBotTaskQueueRepo.updateTaskContext).toHaveBeenCalledWith("task-123", {
        type: "random_post",
        status: "LLM_QUEUED",
        llmTaskId: "llm-task-123",
      });
    });

    it("should process reply_post task correctly", async () => {
      const mockTask = {
        id: "task-123",
        avatarId: "avatar-123",
        task: {
          type: "reply_post",
          replyToPostId: "post-123",
        } as PrismaJson.TaskContext,
      } as unknown as BotTaskQueue;

      const mockBotConfig = {
        id: "config-123",
        prompt: "Test bot prompt",
      };

      const mockOriginalPost = {
        id: "post-123",
        content: "Original post content",
      } as unknown as Post;

      const mockLlmTask = {
        id: "llm-task-123",
      } as unknown as LlmTaskQueue;

      vi.mocked(mockBotTaskQueueRepo.getPendingTasks).mockResolvedValue([mockTask]);
      vi.mocked(mockBotConfigRepo.getBotConfigByAvatarId).mockResolvedValue(mockBotConfig);
      vi.mocked(mockPostRepo.getPostById).mockResolvedValue(mockOriginalPost);
      vi.mocked(mockLlmTaskQueueRepo.enqueueTask).mockResolvedValue(mockLlmTask);

      await botTaskWorker.processTasks();

      expect(mockBotTaskQueueRepo.updateTaskContext).toHaveBeenCalledWith("task-123", {
        type: "reply_post",
        replyToPostId: "post-123",
        status: "CREATED",
      });
      expect(mockPostRepo.getPostById).toHaveBeenCalledWith("post-123");
      expect(mockBotTaskQueueRepo.updateTaskContext).toHaveBeenCalledWith("task-123", {
        type: "reply_post",
        replyToPostId: "post-123",
        status: "LLM_QUEUED",
        llmTaskId: "llm-task-123",
      });
    });

    it("should handle missing bot config gracefully", async () => {
      const mockTask = {
        id: "task-123",
        avatarId: "avatar-123",
        task: {
          type: "random_post",
        } as PrismaJson.TaskContext,
      } as unknown as BotTaskQueue;

      vi.mocked(mockBotTaskQueueRepo.getPendingTasks).mockResolvedValue([mockTask]);
      vi.mocked(mockBotConfigRepo.getBotConfigByAvatarId).mockResolvedValue(null);

      await botTaskWorker.processTasks();

      expect(mockBotTaskQueueRepo.updateTaskContext).toHaveBeenCalledWith("task-123", {
        type: "random_post",
        status: "FAILED",
        error: "No bot config found",
      });
      expect(mockBotTaskQueueRepo.updateTaskStatus).toHaveBeenCalledWith("task-123", "FAILED");
    });

    it("should skip tasks that are in external waiting state", async () => {
      const mockTask = {
        id: "task-123",
        avatarId: "avatar-123",
        task: {
          type: "random_post",
          status: "LLM_PROCESSING",
          llmTaskId: "llm-123",
        } as PrismaJson.TaskContext,
      } as unknown as BotTaskQueue;

      vi.mocked(mockBotTaskQueueRepo.getPendingTasks).mockResolvedValue([mockTask]);

      await botTaskWorker.processTasks();

      expect(mockBotTaskQueueRepo.updateTaskStatus).not.toHaveBeenCalled();
      expect(mockBotConfigRepo.getBotConfigByAvatarId).not.toHaveBeenCalled();
    });
  });
});
