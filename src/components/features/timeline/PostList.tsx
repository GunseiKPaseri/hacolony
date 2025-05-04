"use client";

import { PostItem } from "./PostItem";
import { usePostsAtomValue } from '@/state/posts';

interface PostListProps {
  onReply: (postId: string) => void;
}

export function PostList({ onReply }: PostListProps) {
  const posts = usePostsAtomValue();
  console.log("posts", posts);
  return (
    <div className="space-y-4">
      {posts && posts.map((post) => (
        <div key={post.id} className="space-y-2">
          <PostItem post={post} onReply={onReply} />
          {post.replies && post.replies.length > 0 && (
            <div className="ml-6 border-l pl-4 space-y-2">
              {post.replies.map((reply) => (
                <PostItem
                  key={reply.id}
                  post={reply}
                  onReply={onReply}
                  isReply={true}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}