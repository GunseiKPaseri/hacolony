import { atomWithSuspenseQuery } from "jotai-tanstack-query";
import { Post } from "@/eintities/post";
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
  for (const newPost of newPosts.reverse()) {
    if (prevPosts.originlist.has(newPost.id)) {
      continue; // Skip if the post already exists
    }
    const newPostObject = { ...newPost, replies: [] };
    prevPosts.originlist.set(newPost.id, newPostObject);
    if (newPost.replyToId) {
      const parentPost = prevPosts.originlist.get(newPost.replyToId);
      if (parentPost) {
        parentPost.replies.push(newPostObject);
        if (parentPost.replyToId === null) {
          prevPosts.timeline = [parentPost, ...prevPosts.timeline.filter((post) => post.id !== parentPost.id)];
        }
      }
    } else {
      prevPosts.timeline = [newPostObject, ...prevPosts.timeline];
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
