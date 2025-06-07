import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "../route";
import { InvalidInputError, NotFoundError } from "@/server/repository/util";
import { container } from "@/server/di";
import { PostService } from "@/server/services/postService";
import { DI } from "@/server/di.type";
import { getServerSession } from "next-auth";

// 依存関係をモック
vi.mock("@/server/di", () => ({
  container: {
    resolve: vi.fn(),
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

describe("/api/posts", () => {
  let mockPostService: PostService;
  let mockGetServerSession: any;

  beforeEach(() => {
    mockPostService = {
      getPostsByUserId: vi.fn(),
      createPost: vi.fn(),
    } as any;

    mockGetServerSession = vi.mocked(getServerSession);
    (container.resolve as any).mockReturnValue(mockPostService);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("GET /api/posts", () => {
    it("should return posts for authenticated user", async () => {
      const mockSession = {
        user: { id: "user1" },
      };
      const mockPosts = [
        { id: "post1", content: "テスト投稿1" },
        { id: "post2", content: "テスト投稿2" },
      ];

      mockGetServerSession.mockResolvedValue(mockSession);
      (mockPostService.getPostsByUserId as any).mockResolvedValue(mockPosts);

      const response = await GET();
      const responseData = await response.json();

      expect(container.resolve).toHaveBeenCalledWith(DI.PostService);
      expect(mockPostService.getPostsByUserId).toHaveBeenCalledWith("user1");
      expect(response.status).toBe(200);
      expect(responseData).toEqual(mockPosts);
    });

    it("should return 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET();
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.message).toBe("認証が必要です");
      expect(mockPostService.getPostsByUserId).not.toHaveBeenCalled();
    });

    it("should return 404 when user not found", async () => {
      const mockSession = {
        user: { id: "user1" },
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      (mockPostService.getPostsByUserId as any).mockRejectedValue(new NotFoundError("ユーザーが見つかりません"));

      const response = await GET();
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.message).toBe("ユーザーが見つかりません");
    });

    it("should return 500 for internal server error", async () => {
      const mockSession = {
        user: { id: "user1" },
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      (mockPostService.getPostsByUserId as any).mockRejectedValue(new Error("データベースエラー"));

      const response = await GET();
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.message).toBe("投稿の取得中にエラーが発生しました");
      expect(console.error).toHaveBeenCalledWith("Error fetching posts:", expect.any(Error));
    });
  });

  describe("POST /api/posts", () => {
    const createRequest = (body: any) =>
      ({
        json: vi.fn().mockResolvedValue(body),
      }) as any;

    it("should create post successfully", async () => {
      const mockSession = {
        user: { id: "user1" },
      };
      const requestBody = {
        content: "テスト投稿です",
        replyToId: null,
      };
      const mockPost = {
        id: "post1",
        content: "テスト投稿です",
        postedByUserId: "user1",
        replyToId: null,
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      (mockPostService.createPost as any).mockResolvedValue(mockPost);

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

      mockGetServerSession.mockResolvedValue(mockSession);
      (mockPostService.createPost as any).mockResolvedValue({} as any);

      await POST(createRequest(requestBody));

      expect(mockPostService.createPost).toHaveBeenCalledWith({
        content: "リプライ投稿です",
        postedByUserId: "user1",
        replyToId: "original-post-id",
      });
    });

    it("should return 401 when not authenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

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

      mockGetServerSession.mockResolvedValue(mockSession);
      (mockPostService.createPost as any).mockRejectedValue(new InvalidInputError("投稿内容を入力してください"));

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

      mockGetServerSession.mockResolvedValue(mockSession);
      (mockPostService.createPost as any).mockRejectedValue(new Error("データベースエラー"));

      const response = await POST(createRequest(requestBody));
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.message).toBe("投稿の作成中にエラーが発生しました");
      expect(console.error).toHaveBeenCalledWith("Error creating post:", expect.any(Error));
    });
  });
});
