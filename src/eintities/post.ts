export interface Post {
  id: string;
  content: string;
  createdAt: string;
  postedBy: {
    name: string;
  };
  replyToId: string | null;
  replies: Post[];
}
