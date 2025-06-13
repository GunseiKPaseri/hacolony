export interface Post {
  id: string;
  content: string;
  createdAt: string;
  postedBy: {
    id: string;
    name: string;
    isBot?: boolean;
  };
  replyToId: string | null;
  replies: Post[];
}
