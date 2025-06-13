import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "../route";
import { InvalidInputError, NotFoundError } from "@/server/repository/util";
import { container } from "@/server/di";
import { PostService, type CreatePostInput } from "@/server/services/postService";
import { DI } from "@/server/di.type";
import { getServerSession } from "next-auth";
import type { Post } from "@/generated/client";

// API用のPost型（日付が文字列）
type ApiPost = Omit<Post, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

// 依存関係をモック
vi.mock("@/server/di", () => ({
  container: {
    resolve: vi.fn(),
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// モック用のPostService型
interface MockPostService {
  getPostsByUserId: (userId: string) => Promise<ApiPost[]>;
  getTimelinePostsByUserId: (userId: string) => Promise<ApiPost[]>;
  createPost: (input: CreatePostInput) => Promise<ApiPost>;
}

describe("/api/posts", () => {
  let mockPostService: MockPostService;
  let mockLogger: {
    info: (message: string, ...args: unknown[]) => void;
    error: (error: Error, message: string) => void;
    debug: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
  };

  beforeEach(() => {
    mockPostService = {
      getPostsByUserId: vi.fn(),
      getTimelinePostsByUserId: vi.fn(),
      createPost: vi.fn(),
    };

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    };

    vi.mocked(container.resolve).mockImplementation((symbol) => {
      if (symbol === DI.PostService) {
        return mockPostService as unknown as PostService;
      }
      if (symbol === DI.Logger) {
        return mockLogger;
      }
      throw new Error(`Unexpected symbol: ${symbol.toString()}`);
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("GET /api/posts", () => {
    it("should return posts for authenticated user", async () => {
      const mockSession = {
        user: { id: "user1" },
      };
      const mockPosts: ApiPost[] = [
        {
          id: "post1",
          content: "テスト投稿1",
          createdAt: "2024-01-01T10:00:00.000Z",
          updatedAt: "2024-01-01T10:00:00.000Z",
          postedById: "user1",
          replyToId: null,
          quotedPostId: null,
        },
        {
          id: "post2",
          content: "テスト投稿2",
          createdAt: "2024-01-01T10:00:00.000Z",
          updatedAt: "2024-01-01T10:00:00.000Z",
          postedById: "user1",
          replyToId: null,
          quotedPostId: null,
        },
      ];

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(mockPostService.getTimelinePostsByUserId).mockResolvedValue(mockPosts);

      const response = await GET();
      const responseData = await response.json();

      expect(container.resolve).toHaveBeenCalledWith(DI.PostService);
      expect(mockPostService.getTimelinePostsByUserId).toHaveBeenCalledWith("user1");
      expect(response.status).toBe(200);
      expect(responseData).toEqual(mockPosts);
    });

    it("should return 401 when not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const response = await GET();
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.message).toBe("認証が必要です");
      expect(mockPostService.getTimelinePostsByUserId).not.toHaveBeenCalled();
    });

    it("should return 404 when user not found", async () => {
      const mockSession = {
        user: { id: "user1" },
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(mockPostService.getTimelinePostsByUserId).mockRejectedValue(
        new NotFoundError("ユーザーが見つかりません"),
      );

      const response = await GET();
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.message).toBe("ユーザーが見つかりません");
    });

    it("should return 500 for internal server error", async () => {
      const mockSession = {
        user: { id: "user1" },
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(mockPostService.getTimelinePostsByUserId).mockRejectedValue(new Error("データベースエラー"));

      const response = await GET();
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.message).toBe("投稿の取得中にエラーが発生しました");
      expect(mockLogger.error).toHaveBeenCalledWith({ error: expect.any(Error) }, "Error fetching posts");
    });
  });

  describe("POST /api/posts", () => {
    const createRequest = (body: Record<string, unknown>) =>
      ({
        json: vi.fn().mockResolvedValue(body),
      }) as unknown as Request;

    it("should create post successfully", async () => {
      const mockSession = {
        user: { id: "user1" },
      };
      const requestBody = {
        content: "テスト投稿です",
        replyToId: null,
      };
      const mockPost: ApiPost = {
        id: "post1",
        content: "テスト投稿です",
        postedById: "user1",
        replyToId: null,
        quotedPostId: null,
        createdAt: "2024-01-01T10:00:00.000Z",
        updatedAt: "2024-01-01T10:00:00.000Z",
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(mockPostService.createPost).mockResolvedValue(mockPost);

      const response = await POST(createRequest(requestBody));
      const responseData = await response.json();

      expect(mockPostService.createPost).toHaveBeenCalledWith({
        content: "テスト投稿です",
        postedByUserId: "user1",
        replyToId: null,
      });
      expect(response.status).toBe(201);
      expect(responseData).toEqual(mockPost);
    });

    it("should handle reply posts", async () => {
      const mockSession = {
        user: { id: "user1" },
      };
      const requestBody = {
        content: "リプライ投稿です",
        replyToId: "original-post-id",
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(mockPostService.createPost).mockResolvedValue({} as ApiPost);

      await POST(createRequest(requestBody));

      expect(mockPostService.createPost).toHaveBeenCalledWith({
        content: "リプライ投稿です",
        postedByUserId: "user1",
        replyToId: "original-post-id",
      });
    });

    it("should return 401 when not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const response = await POST(createRequest({}));
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.message).toBe("認証が必要です");
      expect(mockPostService.createPost).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid input", async () => {
      const mockSession = {
        user: { id: "user1" },
      };
      const requestBody = {
        content: "",
        replyToId: null,
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(mockPostService.createPost).mockRejectedValue(new InvalidInputError("投稿内容を入力してください"));

      const response = await POST(createRequest(requestBody));
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.message).toBe("投稿内容を入力してください");
    });

    it("should return 500 for internal server error", async () => {
      const mockSession = {
        user: { id: "user1" },
      };
      const requestBody = {
        content: "テスト投稿です",
        replyToId: null,
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(mockPostService.createPost).mockRejectedValue(new Error("データベースエラー"));

      const response = await POST(createRequest(requestBody));
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.message).toBe("投稿の作成中にエラーが発生しました");
      expect(mockLogger.error).toHaveBeenCalledWith({ error: expect.any(Error) }, "Error creating post");
    });
  });
});
