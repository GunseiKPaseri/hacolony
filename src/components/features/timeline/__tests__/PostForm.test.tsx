import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PostForm } from "../PostForm";

describe("PostForm", () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("should render form elements correctly", () => {
    render(<PostForm onSubmit={mockOnSubmit} error={null} />);

    expect(screen.getByPlaceholderText("何を考えていますか？")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "投稿" })).toBeInTheDocument();
  });

  it("should display error message when error prop is provided", () => {
    const errorMessage = "テストエラーメッセージ";
    render(<PostForm onSubmit={mockOnSubmit} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toHaveClass("text-red-700");
  });

  it("should not display error message when error prop is null", () => {
    render(<PostForm onSubmit={mockOnSubmit} error={null} />);

    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it("should update textarea value when typing", async () => {
    const user = userEvent.setup();
    const { container } = render(<PostForm onSubmit={mockOnSubmit} error={null} />);

    const textarea = container.querySelector('textarea[placeholder="何を考えていますか？"]') as HTMLTextAreaElement;

    await user.type(textarea, "テスト投稿内容");

    expect(textarea).toHaveValue("テスト投稿内容");
  });

  it("should call onSubmit with correct parameters when form is submitted", async () => {
    const user = userEvent.setup();
    render(<PostForm onSubmit={mockOnSubmit} error={null} />);

    const textarea = screen.getByPlaceholderText("何を考えていますか？");
    const submitButton = screen.getByRole("button", { name: "投稿" });

    await user.type(textarea, "テスト投稿内容");
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith(null, "テスト投稿内容");
  });

  it("should clear textarea after successful submission", async () => {
    const user = userEvent.setup();
    render(<PostForm onSubmit={mockOnSubmit} error={null} />);

    const textarea = screen.getByPlaceholderText("何を考えていますか？");
    const submitButton = screen.getByRole("button", { name: "投稿" });

    await user.type(textarea, "テスト投稿内容");
    await user.click(submitButton);

    expect(textarea).toHaveValue("");
  });

  it("should not submit when content is empty", async () => {
    const user = userEvent.setup();
    render(<PostForm onSubmit={mockOnSubmit} error={null} />);

    const submitButton = screen.getByRole("button", { name: "投稿" });

    await user.click(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("should not submit when content is only whitespace", async () => {
    const user = userEvent.setup();
    render(<PostForm onSubmit={mockOnSubmit} error={null} />);

    const textarea = screen.getByPlaceholderText("何を考えていますか？");
    const submitButton = screen.getByRole("button", { name: "投稿" });

    await user.type(textarea, "   ");
    await user.click(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("should submit form when Enter key is pressed in textarea", async () => {
    render(<PostForm onSubmit={mockOnSubmit} error={null} />);

    const textarea = screen.getByPlaceholderText("何を考えていますか？");

    fireEvent.change(textarea, { target: { value: "テスト投稿内容" } });
    fireEvent.submit(textarea.closest("form")!);

    expect(mockOnSubmit).toHaveBeenCalledWith(null, "テスト投稿内容");
  });

  it("should have correct accessibility attributes", () => {
    render(<PostForm onSubmit={mockOnSubmit} error={null} />);

    const textarea = screen.getByPlaceholderText("何を考えていますか？");
    const submitButton = screen.getByRole("button", { name: "投稿" });

    expect(textarea).toHaveAttribute("rows", "3");
    expect(submitButton).toHaveAttribute("type", "submit");
  });
});
