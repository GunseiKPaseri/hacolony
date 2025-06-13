import { describe, it, expect, vi, beforeEach } from "vitest";
import { LlmTaskWorker } from "../llmTaskWorker";
import type { Logger } from "pino";
import type { LlmTaskQueueRepository, PostQueueRepository, BotTaskQueueRepository } from "../../repository/interface";
import type { OllamaClient } from "../../client/OllamaClient";
import type { LlmTaskQueue, PostQueue, BotTaskQueue } from "@/generated/client";

// Mock QueueStatusManager
vi.mock("../queueStatusManager", () => ({
  QueueStatusManager: {
    notifyLLMTaskCompleted: vi.fn(),
    notifyLLMTaskFailed: vi.fn(),
  },
}));

describe("LlmTaskWorker", () => {
  let llmTaskWorker: LlmTaskWorker;
  let mockLogger: Logger;
  let mockLlmTaskQueueRepo: LlmTaskQueueRepository;
  let mockPostQueueRepo: PostQueueRepository;
  let mockBotTaskQueueRepo: BotTaskQueueRepository;
  let mockOllamaClient: OllamaClient;

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

    mockLlmTaskQueueRepo = {
      getPendingTasks: vi.fn().mockResolvedValue([]),
      getProcessingCount: vi.fn().mockResolvedValue(0),
      updateTaskStatus: vi.fn().mockResolvedValue(undefined),
      updateTaskContext: vi.fn().mockResolvedValue(undefined),
      enqueueTask: vi.fn().mockResolvedValue({}),
    };

    mockPostQueueRepo = {
      schedulePost: vi.fn().mockResolvedValue({}),
      getDuePosts: vi.fn().mockResolvedValue([]),
      getProcessingCount: vi.fn().mockResolvedValue(0),
      updatePostContext: vi.fn().mockResolvedValue(undefined),
      markPostAsProcessed: vi.fn().mockResolvedValue(undefined),
      getPostById: vi.fn().mockResolvedValue(null),
    };

    mockBotTaskQueueRepo = {
      getTaskById: vi.fn().mockResolvedValue(null),
      updateTaskContext: vi.fn().mockResolvedValue(undefined),
      updateTaskStatus: vi.fn().mockResolvedValue(undefined),
      getPendingTasks: vi.fn().mockResolvedValue([]),
      getProcessingCount: vi.fn().mockResolvedValue(0),
      enqueueTask: vi.fn().mockResolvedValue({}),
    };

    mockOllamaClient = {
      generatePost: vi.fn().mockResolvedValue("Generated content"),
    } as unknown as OllamaClient;

    llmTaskWorker = new LlmTaskWorker(
      mockLogger,
      mockLlmTaskQueueRepo,
      mockPostQueueRepo,
      mockBotTaskQueueRepo,
      mockOllamaClient,
    );
  });

  describe("processTasks", () => {
    it("should process LLM task and create post queue correctly", async () => {
      const mockLlmTask = {
        id: "llm-task-123",
        prompt: "Generate a post",
        avatarId: "avatar-123",
        botTaskQueueId: "bot-task-123",
      } as unknown as LlmTaskQueue;

      const mockBotTask = {
        id: "bot-task-123",
        task: {
          type: "random_post",
          status: "LLM_QUEUED",
          llmTaskId: "llm-task-123",
        } as PrismaJson.TaskContext,
      } as unknown as BotTaskQueue;

      const mockPostQueue = {
        id: "post-queue-123",
      } as unknown as PostQueue;

      const mockResponse = "Generated post content";

      vi.mocked(mockLlmTaskQueueRepo.getPendingTasks).mockResolvedValue([mockLlmTask]);
      vi.mocked(mockBotTaskQueueRepo.getTaskById).mockResolvedValue(mockBotTask);
      vi.mocked(mockOllamaClient.generatePost).mockResolvedValue(mockResponse);
      vi.mocked(mockPostQueueRepo.schedulePost).mockResolvedValue(mockPostQueue);

      await llmTaskWorker.processTasks();

      expect(mockLlmTaskQueueRepo.updateTaskStatus).toHaveBeenCalledWith("llm-task-123", "PROCESSING");
      expect(mockLlmTaskQueueRepo.updateTaskContext).toHaveBeenCalledWith("llm-task-123", {
        status: "PROCESSING",
        prompt: "Generate a post",
        startedAt: expect.any(String),
      });

      // First call: LLM_PROCESSING
      expect(mockBotTaskQueueRepo.updateTaskContext).toHaveBeenNthCalledWith(1, "bot-task-123", {
        type: "random_post",
        status: "LLM_PROCESSING",
        llmTaskId: "llm-task-123",
      });

      expect(mockOllamaClient.generatePost).toHaveBeenCalledWith("Generate a post");

      expect(mockLlmTaskQueueRepo.updateTaskContext).toHaveBeenCalledWith("llm-task-123", {
        status: "RESPONSED",
        prompt: "Generate a post",
        response: mockResponse,
        completedAt: expect.any(String),
      });

      expect(mockPostQueueRepo.schedulePost).toHaveBeenCalledWith({
        avatarId: "avatar-123",
        content: mockResponse,
        scheduledAt: expect.any(Date),
        context: {
          status: "SCHEDULED",
          content: mockResponse,
          scheduledAt: expect.any(String),
        },
        replyToId: undefined,
        botTaskQueueId: "bot-task-123",
      });

      // Second call: POST_QUEUED
      expect(mockBotTaskQueueRepo.updateTaskContext).toHaveBeenNthCalledWith(2, "bot-task-123", {
        type: "random_post",
        status: "POST_QUEUED",
        llmTaskId: "llm-task-123",
        postQueueId: "post-queue-123",
      });

      expect(mockLlmTaskQueueRepo.updateTaskStatus).toHaveBeenCalledWith("llm-task-123", "COMPLETED");
    });

    it("should handle reply_post task correctly", async () => {
      const mockLlmTask = {
        id: "llm-task-123",
        prompt: "Reply to post",
        avatarId: "avatar-123",
        botTaskQueueId: "bot-task-123",
      } as unknown as LlmTaskQueue;

      const mockBotTask = {
        id: "bot-task-123",
        task: {
          type: "reply_post",
          replyToPostId: "original-post-123",
          status: "LLM_QUEUED",
          llmTaskId: "llm-task-123",
        } as PrismaJson.TaskContext,
      } as unknown as BotTaskQueue;

      const mockPostQueue = {
        id: "post-queue-123",
      } as unknown as PostQueue;

      const mockResponse = "Reply content";

      vi.mocked(mockLlmTaskQueueRepo.getPendingTasks).mockResolvedValue([mockLlmTask]);
      vi.mocked(mockBotTaskQueueRepo.getTaskById).mockResolvedValue(mockBotTask);
      vi.mocked(mockOllamaClient.generatePost).mockResolvedValue(mockResponse);
      vi.mocked(mockPostQueueRepo.schedulePost).mockResolvedValue(mockPostQueue);

      await llmTaskWorker.processTasks();

      expect(mockPostQueueRepo.schedulePost).toHaveBeenCalledWith({
        avatarId: "avatar-123",
        content: mockResponse,
        scheduledAt: expect.any(Date),
        context: {
          status: "SCHEDULED",
          content: mockResponse,
          scheduledAt: expect.any(String),
        },
        replyToId: "original-post-123",
        botTaskQueueId: "bot-task-123",
      });

      // Second call: POST_QUEUED
      expect(mockBotTaskQueueRepo.updateTaskContext).toHaveBeenNthCalledWith(2, "bot-task-123", {
        type: "reply_post",
        replyToPostId: "original-post-123",
        status: "POST_QUEUED",
        llmTaskId: "llm-task-123",
        postQueueId: "post-queue-123",
      });
    });

    it("should handle LLM generation failure", async () => {
      const mockLlmTask = {
        id: "llm-task-123",
        prompt: "Generate a post",
        avatarId: "avatar-123",
        botTaskQueueId: "bot-task-123",
      } as unknown as LlmTaskQueue;

      const mockBotTask = {
        id: "bot-task-123",
        task: {
          type: "random_post",
          status: "LLM_QUEUED",
          llmTaskId: "llm-task-123",
        } as PrismaJson.TaskContext,
      } as unknown as BotTaskQueue;

      const error = new Error("LLM generation failed");

      vi.mocked(mockLlmTaskQueueRepo.getPendingTasks).mockResolvedValue([mockLlmTask]);
      vi.mocked(mockBotTaskQueueRepo.getTaskById).mockResolvedValue(mockBotTask);
      vi.mocked(mockOllamaClient.generatePost).mockRejectedValue(error);

      await llmTaskWorker.processTasks();

      expect(mockLlmTaskQueueRepo.updateTaskContext).toHaveBeenCalledWith("llm-task-123", {
        status: "FAILED",
        prompt: "Generate a post",
        error: "LLM generation failed",
        failedAt: expect.any(String),
      });

      expect(mockLlmTaskQueueRepo.updateTaskStatus).toHaveBeenCalledWith("llm-task-123", "FAILED");

      // Second call: FAILED
      expect(mockBotTaskQueueRepo.updateTaskContext).toHaveBeenNthCalledWith(2, "bot-task-123", {
        type: "random_post",
        status: "FAILED",
        error: "LLM generation failed",
      });
    });
  });
});
