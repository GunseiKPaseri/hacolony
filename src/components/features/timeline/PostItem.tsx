"use client";
import type { Post } from "@/eintities/post";
import { useState } from "react";

interface PostItemProps {
  post: Post;
  onReply: (postId: string, content: string) => void;
  isReply?: boolean;
  depth?: number;
}

export function PostItem({ post, onReply, isReply = false, depth = 0 }: PostItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  
  return (
    <div className={"rounded-lg bg-card p-4" + (depth === 0 ? " border" : "")}>
      <div className="flex items-start space-x-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <div className="font-medium">{post.postedBy.name}</div>
            <div className="text-sm text-gray-500">
              {new Date(post.createdAt).toLocaleString()}
            </div>
            {isReply && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                返信
              </span>
            )}
          </div>
          <div className="text-sm">{post.content}</div>
          <div className="flex space-x-4 text-sm text-gray-500">
            {showReplyForm ? (
              <div className="flex flex-col w-full">
                <textarea
                  className="border rounded p-2 mb-2"
                  placeholder="返信を入力..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                <div className="flex space-x-2">
                  <button
                    className="hover:text-indigo-600 text-xs"
                    onClick={() => {
                      onReply(post.id, replyContent);
                      setShowReplyForm(false);
                      setReplyContent('');
                    }}
                  >
                    送信
                  </button>
                  <button
                    className="hover:text-gray-500 text-xs"
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyContent('');
                    }}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="hover:text-indigo-600"
                onClick={() => setShowReplyForm(true)}
              >
                返信
              </button>
            )}
            <button className="hover:text-indigo-600">引用</button>
            <button className="hover:text-indigo-600">いいね</button>
          </div>
          {/* 返信がある場合、再帰的に表示 */}
          {post.replies && post.replies.length > 0 && (
            <div className="ml-6 border-l pl-1 space-y-2">
              {post.replies.map((reply) => (
                <PostItem
                  key={reply.id}
                  post={reply}
                  onReply={onReply}
                  isReply={true}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}