import { describe, it, expect, vi, beforeEach } from "vitest";
import { PostQueueWorker } from "../postQueueWorker";
import type { Logger } from "pino";
import type { PostQueueRepository } from "../../../domain/postQueue/repository";
import type { PostRepository } from "../../../domain/post/repository";
import type { BotTaskQueueRepository } from "../../../domain/botTaskQueue/repository";
import type { PostQueue, Post, BotTaskQueue } from "@/generated/client";

// Mock QueueStatusManager
vi.mock("../queueStatusManager", () => ({
  QueueStatusManager: {
    notifyPostQueueCompleted: vi.fn(),
    notifyPostQueueFailed: vi.fn(),
  },
}));

describe("PostQueueWorker", () => {
  let postQueueWorker: PostQueueWorker;
  let mockLogger: Logger;
  let mockPostQueueRepo: PostQueueRepository;
  let mockPostRepo: PostRepository;
  let mockBotTaskQueueRepo: BotTaskQueueRepository;

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

    mockPostQueueRepo = {
      getDuePosts: vi.fn().mockResolvedValue([]),
      getProcessingCount: vi.fn().mockResolvedValue(0),
      updatePostContext: vi.fn().mockResolvedValue(undefined),
      markPostAsProcessed: vi.fn().mockResolvedValue(undefined),
      schedulePost: vi.fn().mockResolvedValue({}),
      getPostById: vi.fn().mockResolvedValue(null),
    };

    mockPostRepo = {
      createPostByAvatarId: vi.fn().mockResolvedValue({}),
      getPostById: vi.fn().mockResolvedValue(null),
      createPostByUserId: vi.fn().mockResolvedValue({}),
      getPostsByUserId: vi.fn().mockResolvedValue([]),
      getTimelinePostsByUserId: vi.fn().mockResolvedValue([]),
    };

    mockBotTaskQueueRepo = {
      getTaskById: vi.fn().mockResolvedValue(null),
      updateTaskContext: vi.fn().mockResolvedValue(undefined),
      updateTaskStatus: vi.fn().mockResolvedValue(undefined),
      getPendingTasks: vi.fn().mockResolvedValue([]),
      getProcessingCount: vi.fn().mockResolvedValue(0),
      enqueueTask: vi.fn().mockResolvedValue({}),
    };

    postQueueWorker = new PostQueueWorker(mockLogger, mockPostQueueRepo, mockPostRepo, mockBotTaskQueueRepo);
  });

  describe("processDuePosts", () => {
    it("should process due post and create actual post correctly", async () => {
      const mockDuePost = {
        id: "post-queue-123",
        content: "Post content",
        avatarId: "avatar-123",
        scheduledAt: new Date(),
        replyToId: null,
        botTaskQueueId: "bot-task-123",
      } as unknown as PostQueue;

      const mockBotTask1 = {
        id: "bot-task-123",
        task: {
          type: "random_post",
          status: "POST_QUEUED",
          llmTaskId: "llm-task-123",
          postQueueId: "post-queue-123",
        } as PrismaJson.TaskContext,
      } as unknown as BotTaskQueue;

      const mockBotTask2 = {
        id: "bot-task-123",
        task: {
          type: "random_post",
          status: "POST_PROCESSING",
          llmTaskId: "llm-task-123",
          postQueueId: "post-queue-123",
        } as PrismaJson.TaskContext,
      } as unknown as BotTaskQueue;

      const mockCreatedPost = {
        id: "post-123",
        content: "Post content",
      } as unknown as Post;

      vi.mocked(mockPostQueueRepo.getDuePosts).mockResolvedValue([mockDuePost]);
      vi.mocked(mockBotTaskQueueRepo.getTaskById)
        .mockResolvedValueOnce(mockBotTask1) // First call: POST_QUEUED status
        .mockResolvedValueOnce(mockBotTask2); // Second call: POST_PROCESSING status
      vi.mocked(mockPostRepo.createPostByAvatarId).mockResolvedValue(mockCreatedPost);

      await postQueueWorker.processDuePosts();

      expect(mockPostQueueRepo.updatePostContext).toHaveBeenCalledWith("post-queue-123", {
        status: "POSTING",
        content: "Post content",
        scheduledAt: expect.any(String),
        startedAt: expect.any(String),
      });

      // First call: POST_PROCESSING
      expect(mockBotTaskQueueRepo.updateTaskContext).toHaveBeenNthCalledWith(1, "bot-task-123", {
        type: "random_post",
        status: "POST_PROCESSING",
        llmTaskId: "llm-task-123",
        postQueueId: "post-queue-123",
      });

      expect(mockPostRepo.createPostByAvatarId).toHaveBeenCalledWith({
        content: "Post content",
        postedByAvatarId: "avatar-123",
        replyToId: null,
      });

      expect(mockPostQueueRepo.updatePostContext).toHaveBeenCalledWith("post-queue-123", {
        status: "POSTED",
        content: "Post content",
        scheduledAt: expect.any(String),
        postId: "post-123",
        postedAt: expect.any(String),
      });

      // Second call: POST_COMPLETED
      expect(mockBotTaskQueueRepo.updateTaskContext).toHaveBeenNthCalledWith(2, "bot-task-123", {
        type: "random_post",
        status: "POST_COMPLETED",
        llmTaskId: "llm-task-123",
        postQueueId: "post-queue-123",
        postId: "post-123",
      });

      expect(mockPostQueueRepo.markPostAsProcessed).toHaveBeenCalledWith("post-queue-123");
    });

    it("should handle reply post correctly", async () => {
      const mockDuePost = {
        id: "post-queue-123",
        content: "Reply content",
        avatarId: "avatar-123",
        scheduledAt: new Date(),
        replyToId: "original-post-123",
        botTaskQueueId: "bot-task-123",
      } as unknown as PostQueue;

      const mockBotTask1 = {
        id: "bot-task-123",
        task: {
          type: "reply_post",
          replyToPostId: "original-post-123",
          status: "POST_QUEUED",
          llmTaskId: "llm-task-123",
          postQueueId: "post-queue-123",
        } as PrismaJson.TaskContext,
      } as unknown as BotTaskQueue;

      const mockBotTask2 = {
        id: "bot-task-123",
        task: {
          type: "reply_post",
          replyToPostId: "original-post-123",
          status: "POST_PROCESSING",
          llmTaskId: "llm-task-123",
          postQueueId: "post-queue-123",
        } as PrismaJson.TaskContext,
      } as unknown as BotTaskQueue;

      const mockCreatedPost = {
        id: "post-123",
        content: "Reply content",
      } as unknown as Post;

      vi.mocked(mockPostQueueRepo.getDuePosts).mockResolvedValue([mockDuePost]);
      vi.mocked(mockBotTaskQueueRepo.getTaskById)
        .mockResolvedValueOnce(mockBotTask1) // First call: POST_QUEUED status
        .mockResolvedValueOnce(mockBotTask2); // Second call: POST_PROCESSING status
      vi.mocked(mockPostRepo.createPostByAvatarId).mockResolvedValue(mockCreatedPost);

      await postQueueWorker.processDuePosts();

      expect(mockPostRepo.createPostByAvatarId).toHaveBeenCalledWith({
        content: "Reply content",
        postedByAvatarId: "avatar-123",
        replyToId: "original-post-123",
      });

      // Second call: POST_COMPLETED
      expect(mockBotTaskQueueRepo.updateTaskContext).toHaveBeenNthCalledWith(2, "bot-task-123", {
        type: "reply_post",
        replyToPostId: "original-post-123",
        status: "POST_COMPLETED",
        llmTaskId: "llm-task-123",
        postQueueId: "post-queue-123",
        postId: "post-123",
      });
    });

    it("should handle post creation failure", async () => {
      const mockDuePost = {
        id: "post-queue-123",
        content: "Post content",
        avatarId: "avatar-123",
        scheduledAt: new Date(),
        replyToId: null,
        botTaskQueueId: "bot-task-123",
      } as unknown as PostQueue;

      const mockBotTask1 = {
        id: "bot-task-123",
        task: {
          type: "random_post",
          status: "POST_QUEUED",
          llmTaskId: "llm-task-123",
          postQueueId: "post-queue-123",
        } as PrismaJson.TaskContext,
      } as unknown as BotTaskQueue;

      const mockBotTask2 = {
        id: "bot-task-123",
        task: {
          type: "random_post",
          status: "POST_PROCESSING",
          llmTaskId: "llm-task-123",
          postQueueId: "post-queue-123",
        } as PrismaJson.TaskContext,
      } as unknown as BotTaskQueue;

      const error = new Error("Post creation failed");

      vi.mocked(mockPostQueueRepo.getDuePosts).mockResolvedValue([mockDuePost]);
      vi.mocked(mockBotTaskQueueRepo.getTaskById)
        .mockResolvedValueOnce(mockBotTask1) // First call: POST_QUEUED status
        .mockResolvedValueOnce(mockBotTask2); // Second call: POST_PROCESSING status
      vi.mocked(mockPostRepo.createPostByAvatarId).mockRejectedValue(error);

      await postQueueWorker.processDuePosts();

      expect(mockPostQueueRepo.updatePostContext).toHaveBeenCalledWith("post-queue-123", {
        status: "FAILED",
        content: "Post content",
        scheduledAt: expect.any(String),
        error: "Post creation failed",
        failedAt: expect.any(String),
      });

      // Second call: FAILED
      expect(mockBotTaskQueueRepo.updateTaskContext).toHaveBeenNthCalledWith(2, "bot-task-123", {
        type: "random_post",
        status: "FAILED",
        error: "Post creation failed",
        llmTaskId: "llm-task-123",
        postQueueId: "post-queue-123",
      });
    });

    it("should handle post without bot task correctly", async () => {
      const mockDuePost = {
        id: "post-queue-123",
        content: "Manual post content",
        avatarId: "avatar-123",
        scheduledAt: new Date(),
        replyToId: null,
        botTaskQueueId: null,
      } as unknown as PostQueue;

      const mockCreatedPost = {
        id: "post-123",
        content: "Manual post content",
      } as unknown as Post;

      vi.mocked(mockPostQueueRepo.getDuePosts).mockResolvedValue([mockDuePost]);
      vi.mocked(mockPostRepo.createPostByAvatarId).mockResolvedValue(mockCreatedPost);

      await postQueueWorker.processDuePosts();

      expect(mockPostQueueRepo.updatePostContext).toHaveBeenCalledWith("post-queue-123", {
        status: "POSTING",
        content: "Manual post content",
        scheduledAt: expect.any(String),
        startedAt: expect.any(String),
      });

      expect(mockPostRepo.createPostByAvatarId).toHaveBeenCalledWith({
        content: "Manual post content",
        postedByAvatarId: "avatar-123",
        replyToId: null,
      });

      expect(mockPostQueueRepo.updatePostContext).toHaveBeenCalledWith("post-queue-123", {
        status: "POSTED",
        content: "Manual post content",
        scheduledAt: expect.any(String),
        postId: "post-123",
        postedAt: expect.any(String),
      });

      expect(mockPostQueueRepo.markPostAsProcessed).toHaveBeenCalledWith("post-queue-123");

      // BotTaskQueue関連の処理は呼ばれない
      expect(mockBotTaskQueueRepo.getTaskById).not.toHaveBeenCalled();
      expect(mockBotTaskQueueRepo.updateTaskContext).not.toHaveBeenCalled();
    });
  });
});
