import { atomWithSuspenseQuery } from "jotai-tanstack-query";
import { Post } from "@/entities/post";
import { atom, useAtomValue, useSetAtom } from "jotai";

interface PostResponse {
  id: string;
  content: string;
  createdAt: string;
  postedBy: {
    id: string;
    name: string;
  };
  replyToId: string | null;
}

const fetchPosts = async (cursor: string | null) => {
  const url = new URL("/api/posts", window.location.origin);
  if (cursor) url.searchParams.append("cursor", cursor);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Failed to fetch posts");
  }
  const data: PostResponse[] = await response.json();
  return { data, cursor: data[0]?.id || null };
};

type PostsAtomState = {
  originlist: Map<string, Post>;
  timeline: Post[];
};

const mergePosts = (prevPosts: PostsAtomState, newPosts: PostResponse[]): PostsAtomState => {
  // 投稿を時系列順でソート（古い順）
  const sortedPosts = [...newPosts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  for (const newPost of sortedPosts) {
    if (prevPosts.originlist.has(newPost.id)) {
      continue; // Skip if the post already exists
    }
    const newPostObject = { ...newPost, replies: [] };
    prevPosts.originlist.set(newPost.id, newPostObject);

    if (newPost.replyToId) {
      const parentPost = prevPosts.originlist.get(newPost.replyToId);
      if (parentPost) {
        // 返信を時系列順で挿入
        const insertIndex = parentPost.replies.findIndex(
          (reply) => new Date(reply.createdAt).getTime() > new Date(newPost.createdAt).getTime(),
        );

        if (insertIndex === -1) {
          parentPost.replies.push(newPostObject);
        } else {
          parentPost.replies.splice(insertIndex, 0, newPostObject);
        }

        // 親投稿がトップレベルの場合、タイムラインを更新
        if (parentPost.replyToId === null) {
          prevPosts.timeline = [parentPost, ...prevPosts.timeline.filter((post) => post.id !== parentPost.id)];
        }
      }
    } else {
      // トップレベル投稿は新しい順でタイムラインに追加
      const timelineInsertIndex = prevPosts.timeline.findIndex(
        (post) => new Date(post.createdAt).getTime() < new Date(newPost.createdAt).getTime(),
      );

      if (timelineInsertIndex === -1) {
        prevPosts.timeline.push(newPostObject);
      } else {
        prevPosts.timeline.splice(timelineInsertIndex, 0, newPostObject);
      }
    }
  }

  return { ...prevPosts };
};

const lastCursorAtom = atom<string | null>(null);

const realtimeDataAtom = atomWithSuspenseQuery<{ data: PostResponse[]; cursor: string | null }>((get) => {
  const cursor = get(lastCursorAtom);
  return {
    queryKey: ["incrementPosts", cursor],
    queryFn: async () => fetchPosts(cursor),
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000, // Cache for 10 seconds
  };
});

const postsAtom = atom<PostsAtomState>({ originlist: new Map(), timeline: [] });

const updatePostsAtom = atom(null, async (get, set) => {
  const x = await get(realtimeDataAtom);
  const data = x.data;
  if (!data) return;
  set(postsAtom, (prev) => mergePosts(prev, data.data));
  set(lastCursorAtom, data.cursor);
});

export const usePostsAtomValue = () => useAtomValue(postsAtom).timeline;
export const usePostsAtomRefetch = () => useSetAtom(updatePostsAtom);
