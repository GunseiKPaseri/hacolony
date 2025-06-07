import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { InvalidInputError } from "@/server/repository/util";
import { container } from "@/server/di";
import { UserService } from "@/server/services/userService";
import { DI } from "@/server/di.type";

// DIコンテナをモック
vi.mock("@/server/di", () => ({
  container: {
    resolve: vi.fn(),
  },
}));

describe("/api/auth/register", () => {
  let mockUserService: UserService;

  beforeEach(() => {
    mockUserService = {
      createUser: vi.fn(),
    } as unknown as UserService;

    vi.mocked(container.resolve).mockReturnValue(mockUserService);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  const createRequest = (body: Record<string, unknown>) =>
    ({
      json: vi.fn().mockResolvedValue(body),
    }) as unknown as Request;

  it("should register user successfully", async () => {
    const requestBody = {
      name: "テストユーザー",
      email: "test@example.com",
      password: "password123",
    };

    vi.mocked(mockUserService.createUser).mockResolvedValue();

    const response = await POST(createRequest(requestBody));
    const responseData = await response.json();

    expect(container.resolve).toHaveBeenCalledWith(DI.UserService);
    expect(mockUserService.createUser).toHaveBeenCalledWith(requestBody);
    expect(response.status).toBe(201);
    expect(responseData.message).toBe("ユーザー登録が完了しました");
  });

  it("should return 400 for invalid input", async () => {
    const requestBody = {
      name: "",
      email: "test@example.com",
      password: "password123",
    };

    vi.mocked(mockUserService.createUser).mockRejectedValue(new InvalidInputError("名前を入力してください"));

    const response = await POST(createRequest(requestBody));
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.message).toBe("名前を入力してください");
  });

  it("should return 500 for internal server error", async () => {
    const requestBody = {
      name: "テストユーザー",
      email: "test@example.com",
      password: "password123",
    };

    vi.mocked(mockUserService.createUser).mockRejectedValue(new Error("データベースエラー"));

    const response = await POST(createRequest(requestBody));
    const responseData = await response.json();

    expect(response.status).toBe(500);
    expect(responseData.message).toBe("ユーザー登録中にエラーが発生しました");
    expect(console.error).toHaveBeenCalledWith("Registration error:", expect.any(Error));
  });

  it("should handle malformed JSON", async () => {
    const request = {
      json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as Request;

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(500);
    expect(responseData.message).toBe("ユーザー登録中にエラーが発生しました");
  });
});
