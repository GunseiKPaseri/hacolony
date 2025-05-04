"use client";
import type { Post } from "@/eintities/post";

interface PostItemProps {
  post: Post;
  onReply: (postId: string) => void;
  isReply?: boolean;
}

export function PostItem({ post, onReply, isReply = false }: PostItemProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
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
            <button className="hover:text-indigo-600" onClick={() => onReply(post.id)}>返信</button>
            <button className="hover:text-indigo-600">引用</button>
            <button className="hover:text-indigo-600">いいね</button>
          </div>
        </div>
      </div>
    </div>
  );
}