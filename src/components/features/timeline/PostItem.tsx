"use client";
import type { Post } from "@/eintities/post";

interface PostItemProps {
  post: Post;
}

export function PostItem({ post }: PostItemProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start space-x-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <div className="font-medium">{post.postedBy.name}</div>
            <div className="text-sm text-gray-500">
              {new Date(post.createdAt).toLocaleString()}
            </div>
          </div>
          <div className="text-sm">{post.content}</div>
          <div className="flex space-x-4 text-sm text-gray-500">
            <button className="hover:text-indigo-600">返信</button>
            <button className="hover:text-indigo-600">引用</button>
            <button className="hover:text-indigo-600">いいね</button>
          </div>
        </div>
      </div>
    </div>
  );
}