import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PostItem } from "../PostItem";
import type { Post } from "@/eintities/post";

// モックコンポーネント
vi.mock("../../avatar/AvatarIcon", () => ({
  default: ({ avatar }: any) => <div data-testid="avatar-icon">{avatar.name}</div>,
}));

vi.mock("@/components/ui/IDText", () => ({
  default: ({ id }: any) => <span data-testid="id-text">{id}</span>,
}));

describe("PostItem", () => {
  const mockOnReply = vi.fn();

  const mockPost: Post = {
    id: "post1",
    content: "テスト投稿内容です",
    createdAt: new Date("2024-01-01T10:00:00Z"),
    postedBy: {
      id: "user1",
      name: "テストユーザー",
      imageUrl: null,
      description: null,
      hidden: false,
    },
    replies: [],
  };

  beforeEach(() => {
    mockOnReply.mockClear();
  });

  it("should render post content correctly", () => {
    render(<PostItem post={mockPost} onReply={mockOnReply} />);

    expect(screen.getByText("テスト投稿内容です")).toBeInTheDocument();
    expect(screen.getAllByText("テストユーザー")[0]).toBeInTheDocument();
    expect(screen.getByTestId("id-text")).toHaveTextContent("user1");
    expect(screen.getByTestId("avatar-icon")).toHaveTextContent("テストユーザー");
  });

  it("should display formatted date", () => {
    render(<PostItem post={mockPost} onReply={mockOnReply} />);

    // toLocaleString()の結果は環境によって異なるため、日付が含まれていることを確認
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it("should show reply badge when isReply is true", () => {
    render(<PostItem post={mockPost} onReply={mockOnReply} isReply={true} />);

    const replyBadge = screen.getAllByText("返信").find((element) => element.classList.contains("bg-blue-100"));
    expect(replyBadge).toBeInTheDocument();
    expect(replyBadge).toHaveClass("bg-blue-100", "text-blue-800");
  });

  it("should not show reply badge when isReply is false", () => {
    render(<PostItem post={mockPost} onReply={mockOnReply} isReply={false} />);

    const replyBadge = screen.queryByText(
      (content, element) => content === "返信" && element?.classList.contains("bg-blue-100"),
    );
    expect(replyBadge).not.toBeInTheDocument();
  });

  it("should show reply form when reply button is clicked", async () => {
    const user = userEvent.setup();
    render(<PostItem post={mockPost} onReply={mockOnReply} />);

    const replyButton = screen.getByRole("button", { name: "返信" });
    await user.click(replyButton);

    expect(screen.getByPlaceholderText("返信を入力...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "送信" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "キャンセル" })).toBeInTheDocument();
  });

  it("should handle reply submission", async () => {
    const user = userEvent.setup();
    render(<PostItem post={mockPost} onReply={mockOnReply} />);

    // 返信フォームを開く
    const replyButton = screen.getByRole("button", { name: "返信" });
    await user.click(replyButton);

    // 返信内容を入力
    const textarea = screen.getByPlaceholderText("返信を入力...");
    await user.type(textarea, "テスト返信内容");

    // 送信ボタンをクリック
    const submitButton = screen.getByRole("button", { name: "送信" });
    await user.click(submitButton);

    expect(mockOnReply).toHaveBeenCalledWith("post1", "テスト返信内容");

    // フォームが閉じられることを確認
    expect(screen.queryByPlaceholderText("返信を入力...")).not.toBeInTheDocument();
  });

  it("should handle reply cancellation", async () => {
    const user = userEvent.setup();
    render(<PostItem post={mockPost} onReply={mockOnReply} />);

    // 返信フォームを開く
    const replyButton = screen.getByRole("button", { name: "返信" });
    await user.click(replyButton);

    // 返信内容を入力
    const textarea = screen.getByPlaceholderText("返信を入力...");
    await user.type(textarea, "テスト返信内容");

    // キャンセルボタンをクリック
    const cancelButton = screen.getByRole("button", { name: "キャンセル" });
    await user.click(cancelButton);

    expect(mockOnReply).not.toHaveBeenCalled();

    // フォームが閉じられることを確認
    expect(screen.queryByPlaceholderText("返信を入力...")).not.toBeInTheDocument();
  });

  it("should render nested replies", () => {
    const postWithReplies: Post = {
      ...mockPost,
      replies: [
        {
          id: "reply1",
          content: "返信1の内容",
          createdAt: new Date("2024-01-01T11:00:00Z"),
          postedBy: {
            id: "user2",
            name: "返信ユーザー",
            imageUrl: null,
            description: null,
            hidden: false,
          },
          replies: [],
        },
      ],
    };

    render(<PostItem post={postWithReplies} onReply={mockOnReply} />);

    expect(screen.getByText("返信1の内容")).toBeInTheDocument();
    expect(screen.getAllByText("返信ユーザー")[0]).toBeInTheDocument();
  });

  it("should apply correct CSS classes based on depth", () => {
    const { container } = render(<PostItem post={mockPost} onReply={mockOnReply} depth={0} />);

    const postElement = container.firstChild as HTMLElement;
    expect(postElement).toHaveClass("border");
  });

  it("should render action buttons", () => {
    render(<PostItem post={mockPost} onReply={mockOnReply} />);

    expect(screen.getByRole("button", { name: "返信" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "引用" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "いいね" })).toBeInTheDocument();
  });

  it("should clear reply content after submission", async () => {
    const user = userEvent.setup();
    render(<PostItem post={mockPost} onReply={mockOnReply} />);

    // 返信フォームを開いて内容を入力
    await user.click(screen.getByRole("button", { name: "返信" }));
    const textarea = screen.getByPlaceholderText("返信を入力...");
    await user.type(textarea, "テスト返信内容");

    // 送信
    await user.click(screen.getByRole("button", { name: "送信" }));

    // フォームを再度開いて、内容がクリアされていることを確認
    await user.click(screen.getByRole("button", { name: "返信" }));
    const newTextarea = screen.getByPlaceholderText("返信を入力...");
    expect(newTextarea).toHaveValue("");
  });
});
