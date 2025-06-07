"use client";

import { Suspense } from "react";
import { PostItem } from "./PostItem";
import { usePostsAtomValue } from "@/stores/posts";

interface PostListProps {
  onReply: (postId: string, content: string) => void;
}

const PostListCore: React.FC<PostListProps> = ({ onReply }) => {
  const posts = usePostsAtomValue();
  console.log("posts", posts);

  return (
    <div className="space-y-4">
      {posts && posts.map((post) => <PostItem key={post.id} post={post} onReply={onReply} depth={0} />)}
    </div>
  );
};
export function PostList({ onReply }: PostListProps) {
  return (
    <Suspense fallback={<div className="text-center">Loading...</div>}>
      <PostListCore onReply={onReply} />
    </Suspense>
  );
}
