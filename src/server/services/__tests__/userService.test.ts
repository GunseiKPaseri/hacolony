import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService, type CreateUserInput, type UserWithAvatar } from "../userService";
import { InvalidInputError } from "../../repository/util";
import type { UserRepository, AvatarRepository } from "../../repository/interface";
import type { DBTransaction } from "../../repository/util";
import type { Logger } from "pino";

describe("UserService", () => {
  let userService: UserService;
  let mockUserRepository: UserRepository;
  let mockAvatarRepository: AvatarRepository;
  let mockTransaction: DBTransaction;
  let mockLogger: Logger;

  beforeEach(() => {
    mockUserRepository = {
      createUser: vi.fn(),
      getUserById: vi.fn(),
      getUserByEmail: vi.fn(),
      getUserByIdWithAvatar: vi.fn(),
      isExistUserByEmail: vi.fn(),
      hasAvatar: vi.fn(),
      addSelfAvatar: vi.fn(),
      getSelfAvatar: vi.fn(),
    } as unknown as UserRepository;

    mockAvatarRepository = {
      createAvatar: vi.fn(),
      getAvatarsByUserId: vi.fn(),
      isExistAvatarByName: vi.fn(),
    } as unknown as AvatarRepository;

    mockTransaction = {
      runWithRepository: vi.fn(),
    } as unknown as DBTransaction;

    mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger;

    userService = new UserService(mockAvatarRepository, mockUserRepository, mockTransaction, mockLogger);
  });

  describe("createUser", () => {
    const validInput: CreateUserInput = {
      name: "テストユーザー",
      email: "test@example.com",
      password: "password123",
      avatar: {
        name: "テストアバター",
        description: "テスト用アバター",
        imageUrl: "https://example.com/avatar.jpg",
      },
    };

    it("should create user with valid input", async () => {
      const mockUser = { id: "user1", name: "テストユーザー", email: "test@example.com" };
      const mockAvatar = { id: "avatar1", name: "テストユーザー" };
      
      vi.mocked(mockTransaction.runWithRepository).mockImplementation(async (callback) => {
        const mockRepos = {
          UserRepository: {
            createUser: vi.fn().mockResolvedValue(mockUser),
            addSelfAvatar: vi.fn(),
          },
          AvatarRepository: {
            createAvatar: vi.fn().mockResolvedValue(mockAvatar),
          },
          BotConfigRepository: {},
          BotTaskQueueRepository: {},
          FollowRepository: {},
          LlmTaskQueueRepository: {},
          PostQueueRepository: {},
          PostRepository: {},
        };
        return await callback(mockRepos as any);
      });

      await userService.createUser(validInput);

      expect(mockTransaction.runWithRepository).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        { name: "テストユーザー", email: "test@example.com" },
        "Creating user with self avatar"
      );
    });

    it("should trim name and lowercase email", async () => {
      const input = {
        name: "  テストユーザー  ",
        email: "  TEST@EXAMPLE.COM  ",
        password: "password123",
        avatar: {
          name: "テストアバター",
          description: "テスト用アバター",
          imageUrl: "https://example.com/avatar.jpg",
        },
      };

      vi.mocked(mockTransaction.runWithRepository).mockImplementation(async (callback) => {
        const mockRepos = {
          UserRepository: {
            createUser: vi.fn().mockResolvedValue({ id: "user1" }),
            addSelfAvatar: vi.fn(),
          },
          AvatarRepository: {
            createAvatar: vi.fn().mockResolvedValue({ id: "avatar1" }),
          },
          BotConfigRepository: {},
          BotTaskQueueRepository: {},
          FollowRepository: {},
          LlmTaskQueueRepository: {},
          PostQueueRepository: {},
          PostRepository: {},
        };
        return await callback(mockRepos as any);
      });

      await userService.createUser(input);

      expect(mockLogger.info).toHaveBeenCalledWith(
        { name: "テストユーザー", email: "test@example.com" },
        "Creating user with self avatar"
      );
    });

    it("should create user with different avatar info", async () => {
      const inputWithDifferentAvatar = {
        ...validInput,
        avatar: {
          name: "カスタムアバター",
          description: "カスタム説明",
          imageUrl: "https://example.com/custom-avatar.jpg",
        },
      };
      
      const mockUser = { id: "user1", name: "テストユーザー", email: "test@example.com" };
      const mockAvatar = { id: "avatar1", name: "カスタムアバター" };
      
      vi.mocked(mockTransaction.runWithRepository).mockImplementation(async (callback) => {
        const mockRepos = {
          UserRepository: {
            createUser: vi.fn().mockResolvedValue(mockUser),
            addSelfAvatar: vi.fn(),
          },
          AvatarRepository: {
            createAvatar: vi.fn().mockResolvedValue(mockAvatar),
          },
          BotConfigRepository: {},
          BotTaskQueueRepository: {},
          FollowRepository: {},
          LlmTaskQueueRepository: {},
          PostQueueRepository: {},
          PostRepository: {},
        };
        return await callback(mockRepos as any);
      });

      await userService.createUser(inputWithDifferentAvatar);

      expect(mockTransaction.runWithRepository).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        { name: "テストユーザー", email: "test@example.com" },
        "Creating user with self avatar"
      );
    });

    it("should throw error when avatar name is empty", async () => {
      const input = { 
        ...validInput, 
        avatar: { name: "", description: "説明", imageUrl: "" }
      };
      await expect(userService.createUser(input)).rejects.toThrow(InvalidInputError);
    });

    it("should throw error when avatar is missing", async () => {
      const input = { 
        name: "テストユーザー",
        email: "test@example.com", 
        password: "password123"
      } as CreateUserInput;
      await expect(userService.createUser(input)).rejects.toThrow(InvalidInputError);
    });

    it("should throw error when name is empty", async () => {
      const input = { ...validInput, name: "" };
      await expect(userService.createUser(input)).rejects.toThrow(InvalidInputError);
    });

    it("should throw error when name is only whitespace", async () => {
      const input = { ...validInput, name: "   " };
      await expect(userService.createUser(input)).rejects.toThrow(InvalidInputError);
    });

    it("should throw error when email is empty", async () => {
      const input = { ...validInput, email: "" };
      await expect(userService.createUser(input)).rejects.toThrow(InvalidInputError);
    });

    it("should throw error when password is too short", async () => {
      const input = { ...validInput, password: "12345" };
      await expect(userService.createUser(input)).rejects.toThrow(InvalidInputError);
    });

    it("should throw error when required fields are missing", async () => {
      await expect(userService.createUser({} as CreateUserInput)).rejects.toThrow(InvalidInputError);
    });
  });

  describe("getUserByEmail", () => {
    it("should get user by email", async () => {
      const mockUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        password: "hashedPass",
        createdAt: new Date(),
        updatedAt: new Date(),
        selfAvatarId: "avatar1" as string | null,
      };
      vi.mocked(mockUserRepository.getUserByEmail).mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail("test@example.com");

      expect(result).toBe(mockUser);
      expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith("test@example.com");
    });

    it("should trim and lowercase email", async () => {
      const mockUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        password: "hashedPass",
        createdAt: new Date(),
        updatedAt: new Date(),
        selfAvatarId: "avatar1" as string | null,
      };
      vi.mocked(mockUserRepository.getUserByEmail).mockResolvedValue(mockUser);

      await userService.getUserByEmail("  TEST@EXAMPLE.COM  ");

      expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith("test@example.com");
    });

    it("should throw error when email is empty", async () => {
      await expect(userService.getUserByEmail("")).rejects.toThrow(InvalidInputError);
    });

    it("should throw error when email is only whitespace", async () => {
      await expect(userService.getUserByEmail("   ")).rejects.toThrow(InvalidInputError);
    });
  });

  describe("getUserByIdWithAvatar", () => {
    it("should get user with avatar by id", async () => {
      const mockUser: UserWithAvatar = {
        id: "1",
        name: "テストユーザー",
        email: "test@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
        password: "hashedPass",
        selfAvatarId: "avatar1" as string | null,
        selfAvatar: {
          id: "avatar1",
          name: "アバター",
          description: null,
          imageUrl: null,
          hidden: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: "1",
        },
      };
      vi.mocked(mockUserRepository.getUserByIdWithAvatar).mockResolvedValue(mockUser);

      const result = await userService.getUserByIdWithAvatar("1");

      expect(result).toBe(mockUser);
      expect(mockUserRepository.getUserByIdWithAvatar).toHaveBeenCalledWith("1");
    });

    it("should throw error when userId is empty", async () => {
      await expect(userService.getUserByIdWithAvatar("")).rejects.toThrow(InvalidInputError);
    });
  });

  describe("hasAvatar", () => {
    it("should return true when user has avatar", async () => {
      vi.mocked(mockUserRepository.hasAvatar).mockResolvedValue(true);

      const result = await userService.hasAvatar("1");

      expect(result).toBe(true);
      expect(mockUserRepository.hasAvatar).toHaveBeenCalledWith("1");
    });

    it("should throw error when userId is empty", async () => {
      await expect(userService.hasAvatar("")).rejects.toThrow(InvalidInputError);
    });
  });

  describe("getSelfAvatar", () => {
    it("should return self avatar", async () => {
      const mockUser: UserWithAvatar = {
        id: "1",
        name: "テストユーザー",
        email: "test@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
        password: "hashedPass",
        selfAvatarId: "avatar1" as string | null,
        selfAvatar: {
          id: "avatar1",
          name: "アバター",
          description: null,
          imageUrl: null,
          hidden: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: "1",
        },
      };
      vi.mocked(mockUserRepository.getUserByIdWithAvatar).mockResolvedValue(mockUser);

      const result = await userService.getSelfAvatar("1");

      expect(result).toBe(mockUser.selfAvatar);
    });

    it("should throw error when userId is empty", async () => {
      await expect(userService.getSelfAvatar("")).rejects.toThrow(InvalidInputError);
    });
  });
});
