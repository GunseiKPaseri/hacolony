import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Logger } from "pino";
import { PostService, type CreatePostInput } from "../postService";
import { InvalidInputError } from "../../repository/util";
import type { PostRepository } from "../../repository/interface";
import { BotReplyService } from "../botReplyService";
import type { Post } from "@/generated/client";

describe("PostService", () => {
  let postService: PostService;
  let mockPostRepository: PostRepository;
  let mockBotReplyService: BotReplyService;
  let mockLogger: Logger;

  beforeEach(() => {
    mockPostRepository = {
      getPostsByUserId: vi.fn(),
      getTimelinePostsByUserId: vi.fn(),
      createPostByUserId: vi.fn(),
      createPostByAvatarId: vi.fn(),
      getPostById: vi.fn(),
    };

    mockBotReplyService = {
      triggerBotReplies: vi.fn(),
      triggerRandomBotPosts: vi.fn(),
    } as unknown as BotReplyService;

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    } as unknown as Logger;

    postService = new PostService(mockPostRepository, mockBotReplyService, mockLogger);

    // console.logをモック
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("getPostsByUserId", () => {
    it("should get posts by user id", async () => {
      const mockPosts: Post[] = [
        {
          id: "1",
          content: "テスト投稿1",
          postedById: "user1",
          replyToId: null,
          quotedPostId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          content: "テスト投稿2",
          postedById: "user1",
          replyToId: null,
          quotedPostId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      vi.mocked(mockPostRepository.getPostsByUserId).mockResolvedValue(mockPosts);

      const result = await postService.getPostsByUserId("user1");

      expect(result).toBe(mockPosts);
      expect(mockPostRepository.getPostsByUserId).toHaveBeenCalledWith("user1");
    });

    it("should throw error when userId is empty", async () => {
      await expect(postService.getPostsByUserId("")).rejects.toThrow(InvalidInputError);
    });

    it("should throw error when userId is only whitespace", async () => {
      await expect(postService.getPostsByUserId("   ")).rejects.toThrow(InvalidInputError);
    });
  });

  describe("createPost", () => {
    const validInput: CreatePostInput = {
      content: "テスト投稿です",
      postedByUserId: "user1",
    };

    const mockCreatedPost: Post = {
      id: "post1",
      content: "テスト投稿です",
      postedById: "user1",
      replyToId: null,
      quotedPostId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should create post with valid input", async () => {
      vi.mocked(mockPostRepository.createPostByUserId).mockResolvedValue(mockCreatedPost);
      vi.mocked(mockBotReplyService.triggerBotReplies).mockResolvedValue();

      const result = await postService.createPost(validInput);

      expect(result).toBe(mockCreatedPost);
      expect(mockPostRepository.createPostByUserId).toHaveBeenCalledWith({
        content: "テスト投稿です",
        postedByUserId: "user1",
        replyToId: null,
      });
    });

    it("should trim content and set replyToId to null when not provided", async () => {
      const input = {
        content: "  テスト投稿です  ",
        postedByUserId: "user1",
      };
      vi.mocked(mockPostRepository.createPostByUserId).mockResolvedValue(mockCreatedPost);
      vi.mocked(mockBotReplyService.triggerBotReplies).mockResolvedValue();

      await postService.createPost(input);

      expect(mockPostRepository.createPostByUserId).toHaveBeenCalledWith({
        content: "テスト投稿です",
        postedByUserId: "user1",
        replyToId: null,
      });
    });

    it("should handle replyToId when provided", async () => {
      const input = {
        ...validInput,
        replyToId: "reply1",
      };
      const mockReplyPost = { ...mockCreatedPost, replyToId: "reply1" };
      vi.mocked(mockPostRepository.createPostByUserId).mockResolvedValue(mockReplyPost);
      vi.mocked(mockBotReplyService.triggerBotReplies).mockResolvedValue();

      await postService.createPost(input);

      expect(mockPostRepository.createPostByUserId).toHaveBeenCalledWith({
        content: "テスト投稿です",
        postedByUserId: "user1",
        replyToId: "reply1",
      });
    });

    it("should trigger bot replies in background", async () => {
      vi.mocked(mockPostRepository.createPostByUserId).mockResolvedValue(mockCreatedPost);
      vi.mocked(mockBotReplyService.triggerBotReplies).mockResolvedValue();

      await postService.createPost(validInput);

      expect(mockBotReplyService.triggerBotReplies).toHaveBeenCalledWith("post1", "user1");
    });

    it("should throw error when content is empty", async () => {
      const input = { ...validInput, content: "" };
      await expect(postService.createPost(input)).rejects.toThrow(InvalidInputError);
    });

    it("should throw error when content is only whitespace", async () => {
      const input = { ...validInput, content: "   " };
      await expect(postService.createPost(input)).rejects.toThrow(InvalidInputError);
    });

    it("should throw error when postedByUserId is empty", async () => {
      const input = { ...validInput, postedByUserId: "" };
      await expect(postService.createPost(input)).rejects.toThrow(InvalidInputError);
    });

    it("should throw error when content exceeds 280 characters", async () => {
      const longContent = "a".repeat(281);
      const input = { ...validInput, content: longContent };
      await expect(postService.createPost(input)).rejects.toThrow(InvalidInputError);
    });

    it("should handle bot reply trigger failure silently", async () => {
      vi.mocked(mockPostRepository.createPostByUserId).mockResolvedValue(mockCreatedPost);
      vi.mocked(mockBotReplyService.triggerBotReplies).mockRejectedValue(new Error("Bot error"));

      const result = await postService.createPost(validInput);

      expect(result).toBe(mockCreatedPost);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          postId: "post1",
          authorUserId: "user1",
        }),
        "Background bot reply trigger failed",
      );
    });
  });
});
