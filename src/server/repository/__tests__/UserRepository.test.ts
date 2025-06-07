import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserRepositoryImpl } from "../UserRepository";
import { InvalidInputError, NotFoundError } from "../util";
import type { DBClient } from "../util";
import bcrypt from "bcryptjs";

// bcryptをモック
vi.mock("bcryptjs", () => ({
  default: {
    genSalt: vi.fn(),
    hash: vi.fn(),
  },
}));

describe("UserRepositoryImpl", () => {
  let userRepository: UserRepositoryImpl;
  let mockPrismaClient: DBClient;

  beforeEach(() => {
    mockPrismaClient = {
      user: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    } as any;

    userRepository = new UserRepositoryImpl(mockPrismaClient);

    // bcryptのモック設定
    vi.mocked(bcrypt.genSalt).mockResolvedValue("salt123");
    vi.mocked(bcrypt.hash).mockResolvedValue("hashedPassword123");
  });

  describe("createUser", () => {
    const userInput = {
      name: "テストユーザー",
      email: "test@example.com",
      password: "password123",
    };

    it("should create user successfully", async () => {
      const mockUser = { id: "1", ...userInput, password: "hashedPassword123" };

      // メール重複チェックで既存ユーザーなし
      vi.mocked(mockPrismaClient.user.findUnique).mockResolvedValue(null);
      vi.mocked(mockPrismaClient.user.create).mockResolvedValue(mockUser);

      const result = await userRepository.createUser(userInput);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", "salt123");
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: {
          name: "テストユーザー",
          email: "test@example.com",
          password: "hashedPassword123",
        },
      });
      expect(result).toBe(mockUser);
    });

    it("should throw error when email already exists", async () => {
      const existingUser = { id: "1", email: "test@example.com" };
      vi.mocked(mockPrismaClient.user.findUnique).mockResolvedValue(existingUser);

      await expect(userRepository.createUser(userInput)).rejects.toThrow(InvalidInputError);
      expect(mockPrismaClient.user.create).not.toHaveBeenCalled();
    });
  });

  describe("getUserById", () => {
    it("should return user when found", async () => {
      const mockUser = { id: "1", name: "テストユーザー", email: "test@example.com" };
      vi.mocked(mockPrismaClient.user.findUnique).mockResolvedValue(mockUser);

      const result = await userRepository.getUserById("1");

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
      });
      expect(result).toBe(mockUser);
    });

    it("should throw error when user not found", async () => {
      vi.mocked(mockPrismaClient.user.findUnique).mockResolvedValue(null);

      await expect(userRepository.getUserById("1")).rejects.toThrow(NotFoundError);
    });
  });

  describe("getUserByEmail", () => {
    it("should return user when found", async () => {
      const mockUser = { id: "1", name: "テストユーザー", email: "test@example.com" };
      vi.mocked(mockPrismaClient.user.findUnique).mockResolvedValue(mockUser);

      const result = await userRepository.getUserByEmail("test@example.com");

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(result).toBe(mockUser);
    });

    it("should throw error when user not found", async () => {
      vi.mocked(mockPrismaClient.user.findUnique).mockResolvedValue(null);

      await expect(userRepository.getUserByEmail("test@example.com")).rejects.toThrow(NotFoundError);
    });
  });

  describe("getUserByIdWithAvatar", () => {
    it("should return user with avatar when found", async () => {
      const mockUser = {
        id: "1",
        name: "テストユーザー",
        email: "test@example.com",
        selfAvatar: {
          id: "avatar1",
          name: "アバター",
          description: null,
          imageUrl: null,
          hidden: false,
        },
      };
      vi.mocked(mockPrismaClient.user.findUnique).mockResolvedValue(mockUser);

      const result = await userRepository.getUserByIdWithAvatar("1");

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
        include: { selfAvatar: true },
      });
      expect(result).toBe(mockUser);
    });

    it("should throw error when user not found", async () => {
      vi.mocked(mockPrismaClient.user.findUnique).mockResolvedValue(null);

      await expect(userRepository.getUserByIdWithAvatar("1")).rejects.toThrow(NotFoundError);
    });
  });

  describe("isExistUserByEmail", () => {
    it("should return true when user exists", async () => {
      const mockUser = { id: "1", email: "test@example.com" };
      vi.mocked(mockPrismaClient.user.findUnique).mockResolvedValue(mockUser);

      const result = await userRepository.isExistUserByEmail("test@example.com");

      expect(result).toBe(true);
    });

    it("should return false when user does not exist", async () => {
      vi.mocked(mockPrismaClient.user.findUnique).mockResolvedValue(null);

      const result = await userRepository.isExistUserByEmail("test@example.com");

      expect(result).toBe(false);
    });
  });

  describe("hasAvatar", () => {
    it("should return true when user has avatar", async () => {
      const mockUser = { selfAvatarId: "avatar1" };
      vi.mocked(mockPrismaClient.user.findUnique).mockResolvedValue(mockUser);

      const result = await userRepository.hasAvatar("1");

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
        select: { selfAvatarId: true },
      });
      expect(result).toBe(true);
    });

    it("should return false when user has no avatar", async () => {
      const mockUser = { selfAvatarId: null };
      vi.mocked(mockPrismaClient.user.findUnique).mockResolvedValue(mockUser);

      const result = await userRepository.hasAvatar("1");

      expect(result).toBe(false);
    });

    it("should throw error when user not found", async () => {
      vi.mocked(mockPrismaClient.user.findUnique).mockResolvedValue(null);

      await expect(userRepository.hasAvatar("1")).rejects.toThrow(NotFoundError);
    });
  });

  describe("addSelfAvatar", () => {
    it("should update user with avatar id", async () => {
      await userRepository.addSelfAvatar("user1", "avatar1");

      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: "user1" },
        data: { selfAvatarId: "avatar1" },
      });
    });
  });

  describe("getSelfAvatar", () => {
    it("should return self avatar when user found", async () => {
      const mockUser = {
        selfAvatar: {
          id: "avatar1",
          name: "アバター",
          description: null,
          imageUrl: null,
          hidden: false,
        },
      };
      vi.mocked(mockPrismaClient.user.findUnique).mockResolvedValue(mockUser);

      const result = await userRepository.getSelfAvatar("1");

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
        select: { selfAvatar: true },
      });
      expect(result).toBe(mockUser.selfAvatar);
    });

    it("should throw error when user not found", async () => {
      vi.mocked(mockPrismaClient.user.findUnique).mockResolvedValue(null);

      await expect(userRepository.getSelfAvatar("1")).rejects.toThrow(NotFoundError);
    });
  });
});
