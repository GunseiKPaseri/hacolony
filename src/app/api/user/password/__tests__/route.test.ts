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

describe("/api/user/password PATCH", () => {
  let mockUserService: UserService;
  let mockLogger: { error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserService = {
      updateUserPassword: vi.fn(),
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

  it("should update password successfully", async () => {
    const mockSession: Session = {
      user: { id: "user1", name: "テストユーザー", email: "test@example.com" },
      expires: "2024-12-31T23:59:59.999Z",
    };
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    vi.mocked(mockUserService.updateUserPassword).mockResolvedValue(undefined);

    const request = new NextRequest("http://localhost/api/user/password", {
      method: "PATCH",
      body: JSON.stringify({
        currentPassword: "currentPass123",
        newPassword: "newPass123456",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("パスワードを更新しました");
    expect(mockUserService.updateUserPassword).toHaveBeenCalledWith("user1", "currentPass123", "newPass123456");
  });

  it("should return 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/user/password", {
      method: "PATCH",
      body: JSON.stringify({
        currentPassword: "currentPass123",
        newPassword: "newPass123456",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe("認証が必要です");
    expect(mockUserService.updateUserPassword).not.toHaveBeenCalled();
  });

  it("should return 400 when currentPassword is empty", async () => {
    const mockSession: Session = {
      user: { id: "user1", name: "テストユーザー", email: "test@example.com" },
      expires: "2024-12-31T23:59:59.999Z",
    };
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    const request = new NextRequest("http://localhost/api/user/password", {
      method: "PATCH",
      body: JSON.stringify({
        currentPassword: "",
        newPassword: "newPass123456",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("現在のパスワードを入力してください");
    expect(mockUserService.updateUserPassword).not.toHaveBeenCalled();
  });

  it("should return 400 when newPassword is empty", async () => {
    const mockSession: Session = {
      user: { id: "user1", name: "テストユーザー", email: "test@example.com" },
      expires: "2024-12-31T23:59:59.999Z",
    };
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    const request = new NextRequest("http://localhost/api/user/password", {
      method: "PATCH",
      body: JSON.stringify({
        currentPassword: "currentPass123",
        newPassword: "",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("新しいパスワードを入力してください");
  });

  it("should return 400 when newPassword is too short", async () => {
    const mockSession: Session = {
      user: { id: "user1", name: "テストユーザー", email: "test@example.com" },
      expires: "2024-12-31T23:59:59.999Z",
    };
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    const request = new NextRequest("http://localhost/api/user/password", {
      method: "PATCH",
      body: JSON.stringify({
        currentPassword: "currentPass123",
        newPassword: "12345",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("新しいパスワードは6文字以上である必要があります");
  });

  it("should return 400 when currentPassword is missing", async () => {
    const mockSession: Session = {
      user: { id: "user1", name: "テストユーザー", email: "test@example.com" },
      expires: "2024-12-31T23:59:59.999Z",
    };
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    const request = new NextRequest("http://localhost/api/user/password", {
      method: "PATCH",
      body: JSON.stringify({
        newPassword: "newPass123456",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("現在のパスワードを入力してください");
  });

  it("should return 400 when newPassword is missing", async () => {
    const mockSession: Session = {
      user: { id: "user1", name: "テストユーザー", email: "test@example.com" },
      expires: "2024-12-31T23:59:59.999Z",
    };
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    const request = new NextRequest("http://localhost/api/user/password", {
      method: "PATCH",
      body: JSON.stringify({
        currentPassword: "currentPass123",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("新しいパスワードを入力してください");
  });

  it("should return 400 when passwords are not strings", async () => {
    const mockSession: Session = {
      user: { id: "user1", name: "テストユーザー", email: "test@example.com" },
      expires: "2024-12-31T23:59:59.999Z",
    };
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    const request = new NextRequest("http://localhost/api/user/password", {
      method: "PATCH",
      body: JSON.stringify({
        currentPassword: 123,
        newPassword: 456,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("現在のパスワードを入力してください");
  });

  it("should handle InvalidInputError from service (wrong current password)", async () => {
    const mockSession: Session = {
      user: { id: "user1", name: "テストユーザー", email: "test@example.com" },
      expires: "2024-12-31T23:59:59.999Z",
    };
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    vi.mocked(mockUserService.updateUserPassword).mockRejectedValue(
      new InvalidInputError("現在のパスワードが正しくありません"),
    );

    const request = new NextRequest("http://localhost/api/user/password", {
      method: "PATCH",
      body: JSON.stringify({
        currentPassword: "wrongPassword",
        newPassword: "newPass123456",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("現在のパスワードが正しくありません");
  });

  it("should handle NotFoundError from service", async () => {
    const mockSession: Session = {
      user: { id: "user1", name: "テストユーザー", email: "test@example.com" },
      expires: "2024-12-31T23:59:59.999Z",
    };
    vi.mocked(getServerSession).mockResolvedValue(mockSession);

    vi.mocked(mockUserService.updateUserPassword).mockRejectedValue(new NotFoundError("ユーザーが見つかりません"));

    const request = new NextRequest("http://localhost/api/user/password", {
      method: "PATCH",
      body: JSON.stringify({
        currentPassword: "currentPass123",
        newPassword: "newPass123456",
      }),
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

    vi.mocked(mockUserService.updateUserPassword).mockRejectedValue(new Error("予期しないエラー"));

    const request = new NextRequest("http://localhost/api/user/password", {
      method: "PATCH",
      body: JSON.stringify({
        currentPassword: "currentPass123",
        newPassword: "newPass123456",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe("パスワードの更新中にエラーが発生しました");
    expect(mockLogger.error).toHaveBeenCalledWith({ error: expect.any(Error) }, "Error updating user password");
  });
});
