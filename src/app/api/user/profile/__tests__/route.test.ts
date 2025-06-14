import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { PATCH } from "../route";
import { container } from "@/server/di";
import { UserService } from "@/application/services/userService";
import { InvalidInputError, NotFoundError } from "@/infrastructure/repository/util";
import { DI } from "@/server/di.type";

// Mock external dependencies
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/server/di", () => ({
  container: {
    resolve: vi.fn(),
  },
}));

describe("/api/user/profile PATCH", () => {
  let mockUserService: UserService;
  let mockLogger: { error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserService = {
      updateUserProfile: vi.fn(),
    } as unknown as UserService;

    mockLogger = {
      error: vi.fn(),
    };

    vi.mocked(container.resolve).mockImplementation((token) => {
      if (token === DI.UserService) return mockUserService;
      if (token === DI.Logger) return mockLogger;
      throw new Error(`Unknown token: ${String(token)}`);
    });
  });

  it("should update user profile successfully", async () => {
    const updatedUser = {
      id: "user1",
      name: "新しいユーザー名",
      email: "test@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
      password: "hashedPassword",
      selfAvatarId: "avatar1",
    };

    const mockSession: Session = {
      user: { id: "user1", name: "テストユーザー", email: "test@example.com" },
      expires: "2024-12-31T23:59:59.999Z",
    };
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    vi.mocked(mockUserService.updateUserProfile).mockResolvedValue(updatedUser);

    const request = new NextRequest("http://localhost/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "新しいユーザー名" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
    });
    expect(mockUserService.updateUserProfile).toHaveBeenCalledWith("user1", {
      name: "新しいユーザー名",
    });
  });

  it("should return 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "新しいユーザー名" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe("認証が必要です");
    expect(mockUserService.updateUserProfile).not.toHaveBeenCalled();
  });

  it("should return 400 when name is empty", async () => {
    const mockSession: Session = {
      user: { id: "user1", name: "テストユーザー", email: "test@example.com" },
      expires: "2024-12-31T23:59:59.999Z",
    };
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    const request = new NextRequest("http://localhost/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("ユーザー名を入力してください");
    expect(mockUserService.updateUserProfile).not.toHaveBeenCalled();
  });

  it("should return 400 when name is only whitespace", async () => {
    const mockSession: Session = {
      user: { id: "user1", name: "テストユーザー", email: "test@example.com" },
      expires: "2024-12-31T23:59:59.999Z",
    };
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    const request = new NextRequest("http://localhost/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "   " }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("ユーザー名を入力してください");
  });

  it("should return 400 when name is too long", async () => {
    const mockSession: Session = {
      user: { id: "user1", name: "テストユーザー", email: "test@example.com" },
      expires: "2024-12-31T23:59:59.999Z",
    };
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    const longName = "a".repeat(51);
    const request = new NextRequest("http://localhost/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: longName }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("ユーザー名は50文字以内で入力してください");
  });

  it("should return 400 when name is missing", async () => {
    const mockSession: Session = {
      user: { id: "user1", name: "テストユーザー", email: "test@example.com" },
      expires: "2024-12-31T23:59:59.999Z",
    };
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    const request = new NextRequest("http://localhost/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("ユーザー名を入力してください");
  });

  it("should return 400 when name is not a string", async () => {
    const mockSession: Session = {
      user: { id: "user1", name: "テストユーザー", email: "test@example.com" },
      expires: "2024-12-31T23:59:59.999Z",
    };
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    const request = new NextRequest("http://localhost/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: 123 }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("ユーザー名を入力してください");
  });

  it("should handle InvalidInputError from service", async () => {
    const mockSession: Session = {
      user: { id: "user1", name: "テストユーザー", email: "test@example.com" },
      expires: "2024-12-31T23:59:59.999Z",
    };
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    vi.mocked(mockUserService.updateUserProfile).mockRejectedValue(new InvalidInputError("サービスエラー"));

    const request = new NextRequest("http://localhost/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "新しいユーザー名" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("サービスエラー");
  });

  it("should handle NotFoundError from service", async () => {
    const mockSession: Session = {
      user: { id: "user1", name: "テストユーザー", email: "test@example.com" },
      expires: "2024-12-31T23:59:59.999Z",
    };
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    vi.mocked(mockUserService.updateUserProfile).mockRejectedValue(new NotFoundError("ユーザーが見つかりません"));

    const request = new NextRequest("http://localhost/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "新しいユーザー名" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toBe("ユーザーが見つかりません");
  });

  it("should handle unexpected errors", async () => {
    const mockSession: Session = {
      user: { id: "user1", name: "テストユーザー", email: "test@example.com" },
      expires: "2024-12-31T23:59:59.999Z",
    };
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    vi.mocked(mockUserService.updateUserProfile).mockRejectedValue(new Error("予期しないエラー"));

    const request = new NextRequest("http://localhost/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "新しいユーザー名" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe("ユーザー情報の更新中にエラーが発生しました");
    expect(mockLogger.error).toHaveBeenCalledWith({ error: expect.any(Error) }, "Error updating user profile");
  });
});
