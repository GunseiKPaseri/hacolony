export interface Post {
  id: string;
  content: string;
  createdAt: string;
  postedBy: {
    id: string;
    name: string;
  };
  replyToId: string | null;
  replies: Post[];
}
