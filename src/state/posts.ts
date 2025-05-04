import { atomWithSuspenseQuery } from 'jotai-tanstack-query'
import { Post } from '@/eintities/post';
import { atom, useAtomValue, useSetAtom } from 'jotai';

interface PostResponse {
  id: string;
  content: string;
  createdAt: string;
  postedBy: {
    name: string;
  };
  replyToId: string | null;
}

const fetchPosts = async (cursor: string | null) => {
  const url = new URL('/api/posts', window.location.origin);
  if(cursor) url.searchParams.append('cursor', cursor);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }
  const data: PostResponse[] = await response.json();
  return {data, cursor: data[0]?.id || null};
}

const mergePosts = (prevPosts: Post[], newPosts: PostResponse[]) => {
  let posts = prevPosts;
  const oldIDs = new Set(posts.map(post => post.id));

  for (const newPost of newPosts.reverse()) {
    if (oldIDs.has(newPost.id)) {
      continue; // Skip if the post already exists
    }
    const newPostObject = {...newPost, replies: []}
    if(newPost.replyToId) {
      const parentPost = posts.find(post => post.id === newPost.replyToId);
      if (parentPost) {
        if(parentPost.replies.map(reply => reply.id).includes(newPost.id)){
          continue;
        }
        parentPost.replies.push(newPostObject);
        posts = [parentPost, ...posts.filter(post => post.id !== parentPost.id)];
      } else {
        posts = [newPostObject, ...posts];
      }
    } else {
      posts = [newPostObject, ...posts];
    }
  }

  return posts;
}

const lastCursorAtom = atom<string | null>(null);

const realtimeDataAtom = atomWithSuspenseQuery<{data: PostResponse[], cursor: string | null}>((get) => {
  const cursor = get(lastCursorAtom);
  return {
    queryKey: ['incrementPosts', cursor],
    queryFn: async () => fetchPosts(cursor),
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000, // Cache for 10 seconds
  }
});

const postsAtom = atom<Post[]>([])

const updatePostsAtom = atom(null, async (get, set) => {
  const x = await get(realtimeDataAtom);
  const data = x.data;
  if (!data) return;
  set(postsAtom, (prev) => mergePosts(prev, data.data));
  set(lastCursorAtom, data.cursor);
});

export const usePostsAtomValue = () => useAtomValue(postsAtom);
export const usePostsAtomRefetch = () => useSetAtom(updatePostsAtom);
