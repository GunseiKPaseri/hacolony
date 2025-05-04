import { atomWithQuery } from 'jotai-tanstack-query'
import { Post } from '@/eintities/post';

// Atom for storing all posts
export const postsAtom = atomWithQuery<Post[]>((_get) => ({
  queryKey: ['posts'],
  queryFn: async () => {
    const response = await fetch('/api/posts');
    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }
    const data = await response.json();
    return data;
  },
  refetchInterval: 10000, // Refetch every 10 seconds
  staleTime: 5000, // Cache for 10 seconds
}));
