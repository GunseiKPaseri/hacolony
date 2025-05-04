"use client";

import { PostItem } from "./PostItem";
import { useAtom } from 'jotai';
import { postsAtom } from '@/state/posts';

export function PostList() {
  const [{data: posts}] = useAtom(postsAtom);
  return (
    <div className="space-y-4">
      {posts && posts.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}
    </div>
  );
}