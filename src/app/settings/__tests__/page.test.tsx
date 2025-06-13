import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { useSession } from "next-auth/react";
import SettingsPage from "../page";

// Mock next-auth
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<"div">) => <div {...props}>{children}</div>,
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("SettingsPage", () => {
  const mockSession = {
    user: {
      id: "user1",
      name: "テストユーザー",
      email: "test@example.com",
    },
    expires: "2024-12-31T23:59:59.999Z",
  };

  const mockUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    mockUpdate.mockClear();
    vi.mocked(useSession).mockReturnValue({
      data: mockSession,
      update: mockUpdate,
      status: "authenticated",
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("should render settings page with user information", () => {
    render(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "設定" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ユーザー名" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "パスワード" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "アカウント情報" })).toBeInTheDocument();
    expect(screen.getByLabelText("ユーザー名")).toHaveValue("テストユーザー");
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("should enable save button when username is changed", async () => {
    render(<SettingsPage />);

    const usernameInput = screen.getByLabelText("ユーザー名");
    const saveButtons = screen.getAllByRole("button", { name: /保存/ });
    const usernameSaveButton = saveButtons[0]; // 最初の保存ボタンがユーザー名用

    // Initially save button should be disabled
    expect(usernameSaveButton).toBeDisabled();

    // Change username
    fireEvent.change(usernameInput, { target: { value: "新しいユーザー名" } });

    // Save button should now be enabled
    expect(usernameSaveButton).toBeEnabled();
  });

  it("should disable save button when username is unchanged", async () => {
    render(<SettingsPage />);

    const usernameInput = screen.getByLabelText("ユーザー名");
    const saveButtons = screen.getAllByRole("button", { name: /保存/ });
    const usernameSaveButton = saveButtons[0];

    // Change username and then change it back
    fireEvent.change(usernameInput, { target: { value: "新しいユーザー名" } });
    fireEvent.change(usernameInput, { target: { value: "テストユーザー" } });

    // Save button should be disabled again
    expect(usernameSaveButton).toBeDisabled();
  });

  it("should update username successfully", async () => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "user1",
        name: "新しいユーザー名",
        email: "test@example.com",
      }),
    });

    render(<SettingsPage />);

    const usernameInput = screen.getByLabelText("ユーザー名");
    const saveButtons = screen.getAllByRole("button", { name: /保存/ });
    const usernameSaveButton = saveButtons[0];

    // Change username
    fireEvent.change(usernameInput, { target: { value: "新しいユーザー名" } });
    fireEvent.click(usernameSaveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "新しいユーザー名" }),
      });
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ name: "新しいユーザー名" });
    });

    await waitFor(() => {
      expect(screen.getByText("ユーザー名を更新しました")).toBeInTheDocument();
    });
  });

  it("should show error when username update fails", async () => {
    // 明示的にfetchをリセット
    mockFetch.mockReset();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        message: "ユーザー名は50文字以内で入力してください",
      }),
    });

    render(<SettingsPage />);

    const usernameInput = screen.getByLabelText("ユーザー名");
    const saveButtons = screen.getAllByRole("button", { name: /保存/ });
    const usernameSaveButton = saveButtons[0];

    // Change username
    fireEvent.change(usernameInput, { target: { value: "新しいユーザー名" } });
    fireEvent.click(usernameSaveButton);

    await waitFor(() => {
      expect(screen.getByText("ユーザー名は50文字以内で入力してください")).toBeInTheDocument();
    });
  });

  it("should update password successfully", async () => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: "パスワードを更新しました",
      }),
    });

    render(<SettingsPage />);

    const currentPasswordInput = screen.getByPlaceholderText("現在のパスワードを入力");
    const newPasswordInput = screen.getByPlaceholderText("新しいパスワードを入力（6文字以上）");
    const confirmPasswordInput = screen.getByPlaceholderText("新しいパスワードを再入力");
    const updatePasswordButton = screen.getByRole("button", { name: /パスワードを変更/ });

    // Fill password fields
    fireEvent.change(currentPasswordInput, { target: { value: "currentPass123" } });
    fireEvent.change(newPasswordInput, { target: { value: "newPass123456" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "newPass123456" } });

    // Click update password button
    fireEvent.click(updatePasswordButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/user/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: "currentPass123",
          newPassword: "newPass123456",
        }),
      });
    });

    await waitFor(() => {
      expect(screen.getByText("パスワードを更新しました")).toBeInTheDocument();
    });

    // Password fields should be cleared
    expect(currentPasswordInput).toHaveValue("");
    expect(newPasswordInput).toHaveValue("");
    expect(confirmPasswordInput).toHaveValue("");
  });

  it("should show error when passwords don't match", async () => {
    render(<SettingsPage />);

    const currentPasswordInput = screen.getByPlaceholderText("現在のパスワードを入力");
    const newPasswordInput = screen.getByPlaceholderText("新しいパスワードを入力（6文字以上）");
    const confirmPasswordInput = screen.getByPlaceholderText("新しいパスワードを再入力");
    const updatePasswordButton = screen.getByRole("button", { name: /パスワードを変更/ });

    // Fill password fields with mismatching passwords
    fireEvent.change(currentPasswordInput, { target: { value: "currentPass123" } });
    fireEvent.change(newPasswordInput, { target: { value: "newPass123456" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "differentPass" } });

    // Click update password button
    fireEvent.click(updatePasswordButton);

    await waitFor(() => {
      expect(screen.getByText("新しいパスワードが一致しません")).toBeInTheDocument();
    });

    // API should not be called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should show error when new password is too short", async () => {
    render(<SettingsPage />);

    const currentPasswordInput = screen.getByPlaceholderText("現在のパスワードを入力");
    const newPasswordInput = screen.getByPlaceholderText("新しいパスワードを入力（6文字以上）");
    const confirmPasswordInput = screen.getByPlaceholderText("新しいパスワードを再入力");
    const updatePasswordButton = screen.getByRole("button", { name: /パスワードを変更/ });

    // Fill password fields with short password
    fireEvent.change(currentPasswordInput, { target: { value: "currentPass123" } });
    fireEvent.change(newPasswordInput, { target: { value: "12345" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "12345" } });

    // Click update password button
    fireEvent.click(updatePasswordButton);

    await waitFor(() => {
      expect(screen.getByText("新しいパスワードは6文字以上である必要があります")).toBeInTheDocument();
    });

    // API should not be called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should show error when password fields are empty", async () => {
    render(<SettingsPage />);

    const updatePasswordButton = screen.getByRole("button", { name: /パスワードを変更/ });

    // Button should be disabled when fields are empty, so this test is not applicable
    // Instead, test that the button is disabled
    expect(updatePasswordButton).toBeDisabled();

    // API should not be called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should disable password update button when fields are empty", () => {
    render(<SettingsPage />);

    const updatePasswordButton = screen.getByRole("button", { name: /パスワードを変更/ });

    // Button should be disabled when fields are empty
    expect(updatePasswordButton).toBeDisabled();
  });

  it("should enable password update button when all fields are filled", async () => {
    render(<SettingsPage />);

    const currentPasswordInput = screen.getByPlaceholderText("現在のパスワードを入力");
    const newPasswordInput = screen.getByPlaceholderText("新しいパスワードを入力（6文字以上）");
    const confirmPasswordInput = screen.getByPlaceholderText("新しいパスワードを再入力");
    const updatePasswordButton = screen.getByRole("button", { name: /パスワードを変更/ });

    // Fill all password fields
    fireEvent.change(currentPasswordInput, { target: { value: "currentPass123" } });
    fireEvent.change(newPasswordInput, { target: { value: "newPass123456" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "newPass123456" } });

    // Button should now be enabled
    expect(updatePasswordButton).toBeEnabled();
  });

  it("should show error when password update fails", async () => {
    // 明示的にfetchをリセット
    mockFetch.mockReset();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        message: "現在のパスワードが正しくありません",
      }),
    });

    render(<SettingsPage />);

    const currentPasswordInput = screen.getByPlaceholderText("現在のパスワードを入力");
    const newPasswordInput = screen.getByPlaceholderText("新しいパスワードを入力（6文字以上）");
    const confirmPasswordInput = screen.getByPlaceholderText("新しいパスワードを再入力");
    const updatePasswordButton = screen.getByRole("button", { name: /パスワードを変更/ });

    // Fill password fields
    fireEvent.change(currentPasswordInput, { target: { value: "wrongPassword" } });
    fireEvent.change(newPasswordInput, { target: { value: "newPass123456" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "newPass123456" } });

    // Click update password button
    fireEvent.click(updatePasswordButton);

    await waitFor(() => {
      expect(screen.getByText("現在のパスワードが正しくありません")).toBeInTheDocument();
    });
  });
});
