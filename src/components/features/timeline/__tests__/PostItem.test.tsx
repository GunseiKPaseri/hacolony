import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PostItem } from "../PostItem";
import type { Post } from "@/domain/post/entity";

// モックコンポーネント
vi.mock("../../avatar/AvatarIcon", () => ({
  default: ({ avatar }: { avatar: { name: string } }) => <div data-testid="avatar-icon">{avatar.name}</div>,
}));

vi.mock("@/components/ui/IDText", () => ({
  default: ({ id }: { id: string }) => <span data-testid="id-text">{id}</span>,
}));

// Framer Motion のアニメーションを無効化
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<"div">) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

describe("PostItem", () => {
  const mockOnReply = vi.fn();

  const mockPost: Post = {
    id: "post1",
    content: "テスト投稿内容です",
    createdAt: "2024-01-01T10:00:00Z",
    postedBy: {
      id: "user1",
      name: "テストユーザー",
    },
    replies: [],
    replyToId: null,
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

    // formatRelativeTime()の結果は環境によって異なるため、時間が含まれていることを確認
    const timeElements = screen.getAllByText(/日前|時間前|分前/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it("should show reply badge when isReply is true", () => {
    render(<PostItem post={mockPost} onReply={mockOnReply} isReply={true} />);

    const replyBadge = screen.getByText("返信");
    expect(replyBadge).toBeInTheDocument();
    // 実際のクラス名を確認（現在の実装に合わせる）
    expect(replyBadge).toHaveClass("text-green-800");
  });

  it("should not show reply badge when isReply is false", () => {
    render(<PostItem post={mockPost} onReply={mockOnReply} isReply={false} />);

    const replyBadge = screen.queryByText("返信");
    expect(replyBadge).not.toBeInTheDocument();
  });

  it("should show reply form when reply button is clicked", async () => {
    const user = userEvent.setup();
    render(<PostItem post={mockPost} onReply={mockOnReply} />);

    const replyButtons = screen.getAllByRole("button");
    const replyButton = replyButtons.find((button) => button.textContent?.includes("0")); // "0" replies を含むボタン
    await user.click(replyButton!);

    expect(screen.getByPlaceholderText("返信を投稿")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "キャンセル" })).toBeInTheDocument();
  });

  it("should handle reply submission", async () => {
    const user = userEvent.setup();
    render(<PostItem post={mockPost} onReply={mockOnReply} />);

    // 返信フォームを開く
    const replyButtons = screen.getAllByRole("button");
    const replyButton = replyButtons.find((button) => button.textContent?.includes("0")); // "0" replies を含むボタン
    await user.click(replyButton!);

    // 返信内容を入力
    const textarea = screen.getByPlaceholderText("返信を投稿");
    await user.type(textarea, "テスト返信内容");

    // 送信ボタンをクリック（返信フォーム内の返信ボタン）
    const submitButton = screen.getByRole("button", { name: "返信" });
    await user.click(submitButton);

    expect(mockOnReply).toHaveBeenCalledWith("post1", "テスト返信内容");

    // フォームが閉じられることを確認
    expect(screen.queryByPlaceholderText("返信を投稿")).not.toBeInTheDocument();
  });

  it("should handle reply cancellation", async () => {
    const user = userEvent.setup();
    render(<PostItem post={mockPost} onReply={mockOnReply} />);

    // 返信フォームを開く
    const replyButtons = screen.getAllByRole("button");
    const replyButton = replyButtons.find((button) => button.textContent?.includes("0")); // "0" replies を含むボタン
    await user.click(replyButton!);

    // 返信内容を入力
    const textarea = screen.getByPlaceholderText("返信を投稿");
    await user.type(textarea, "テスト返信内容");

    // キャンセルボタンをクリック
    const cancelButton = screen.getByRole("button", { name: "キャンセル" });
    await user.click(cancelButton);

    expect(mockOnReply).not.toHaveBeenCalled();

    // フォームが閉じられることを確認
    expect(screen.queryByPlaceholderText("返信を投稿")).not.toBeInTheDocument();
  });

  it("should render nested replies", () => {
    const postWithReplies: Post = {
      ...mockPost,
      replies: [
        {
          id: "reply1",
          content: "返信1の内容",
          createdAt: "2024-01-01T11:00:00Z",
          postedBy: {
            id: "user2",
            name: "返信ユーザー",
          },
          replies: [],
          replyToId: "post1",
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
    expect(postElement).toHaveClass("border-b");
  });

  it("should render action buttons", () => {
    render(<PostItem post={mockPost} onReply={mockOnReply} />);

    const buttons = screen.getAllByRole("button");
    // アクションボタンが存在することを確認（アイコンとカウントを含む）
    expect(buttons.length).toBeGreaterThan(0);

    // 各アクションボタンのアイコンや機能を確認
    const replyButton = buttons.find((button) => button.textContent?.includes("0"));
    expect(replyButton).toBeInTheDocument();
  });

  it("should clear reply content after submission", async () => {
    const user = userEvent.setup();
    render(<PostItem post={mockPost} onReply={mockOnReply} />);

    // 返信フォームを開いて内容を入力
    const replyButtons = screen.getAllByRole("button");
    const replyButton = replyButtons.find((button) => button.textContent?.includes("0"));
    await user.click(replyButton!);

    const textarea = screen.getByPlaceholderText("返信を投稿");
    await user.type(textarea, "テスト返信内容");

    // 送信（返信フォーム内の返信ボタン）
    const submitButton = screen.getByRole("button", { name: "返信" });
    await user.click(submitButton);

    // フォームを再度開いて、内容がクリアされていることを確認
    const newReplyButtons = screen.getAllByRole("button");
    const newReplyButton = newReplyButtons.find((button) => button.textContent?.includes("0"));
    await user.click(newReplyButton!);

    const newTextarea = screen.getByPlaceholderText("返信を投稿");
    expect(newTextarea).toHaveValue("");
  });
});
