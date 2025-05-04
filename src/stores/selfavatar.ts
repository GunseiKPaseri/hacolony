import { atomWithQuery } from 'jotai-tanstack-query'

export type Avatar = {
  name: string;
  hidden: boolean;
  id: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
}

export type AvatarResponse = Avatar | {message: string};

// Atom for storing all posts
export const selfAvatarAtom = atomWithQuery<AvatarResponse>((_get) => ({
  queryKey: ['selfavatar'],
  queryFn: async () => {
    const response = await fetch('/api/selfavatar');
    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }
    const data = await response.json();
    return data;
  },
  refetchInterval: 10000, // Refetch every 10 seconds
  staleTime: 5000, // Cache for 10 seconds
}));
