import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService, type CreateUserInput, type UserWithAvatar } from "../userService";
import { InvalidInputError } from "../../repository/util";
import type { UserRepository } from "../../repository/interface";

describe("UserService", () => {
  let userService: UserService;
  let mockUserRepository: UserRepository;
  let mockAvatarRepository: UserRepository;

  beforeEach(() => {
    mockUserRepository = {
      createUser: vi.fn(),
      getUserByEmail: vi.fn(),
      getUserByIdWithAvatar: vi.fn(),
      hasAvatar: vi.fn(),
    } as any;

    mockAvatarRepository = {
      createUser: vi.fn(),
      getUserByEmail: vi.fn(),
      getUserByIdWithAvatar: vi.fn(),
      hasAvatar: vi.fn(),
    } as any;

    userService = new UserService(mockAvatarRepository, mockUserRepository);
  });

  describe("createUser", () => {
    const validInput: CreateUserInput = {
      name: "テストユーザー",
      email: "test@example.com",
      password: "password123",
    };

    it("should create user with valid input", async () => {
      await userService.createUser(validInput);

      expect(mockUserRepository.createUser).toHaveBeenCalledWith({
        name: "テストユーザー",
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should trim name and lowercase email", async () => {
      const input = {
        name: "  テストユーザー  ",
        email: "  TEST@EXAMPLE.COM  ",
        password: "password123",
      };

      await userService.createUser(input);

      expect(mockUserRepository.createUser).toHaveBeenCalledWith({
        name: "テストユーザー",
        email: "test@example.com",
        password: "password123",
      });
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
      const mockUser = { id: "1", email: "test@example.com" };
      vi.mocked(mockUserRepository.getUserByEmail).mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail("test@example.com");

      expect(result).toBe(mockUser);
      expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith("test@example.com");
    });

    it("should trim and lowercase email", async () => {
      const mockUser = { id: "1", email: "test@example.com" };
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
        selfAvatar: {
          id: "avatar1",
          name: "アバター",
          description: null,
          imageUrl: null,
          hidden: false,
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
        selfAvatar: {
          id: "avatar1",
          name: "アバター",
          description: null,
          imageUrl: null,
          hidden: false,
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
