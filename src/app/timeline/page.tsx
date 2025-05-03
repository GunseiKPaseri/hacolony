"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface Post {
  id: string;
  content: string;
  createdAt: string;
  avatar: {
    name: string;
  };
}

export default function TimelinePage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts");
      if (!response.ok) {
        throw new Error("投稿の取得に失敗しました");
      }
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError("投稿の取得中にエラーが発生しました");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("投稿の作成に失敗しました");
      }

      setContent("");
      fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      setError("投稿の作成中にエラーが発生しました");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/timeline" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">hacolony</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/profile">プロフィール</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/settings">設定</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/logout">ログアウト</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="space-y-4">
                <div className="rounded-lg border bg-card p-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="rounded-md bg-red-50 p-4">
                        <div className="text-sm text-red-700">{error}</div>
                      </div>
                    )}
                    <div className="flex items-start space-x-4">
                      <div className="flex-1 space-y-2">
                        <textarea
                          className="w-full resize-none rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                          placeholder="何を考えていますか？"
                          rows={3}
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                        />
                        <div className="flex justify-end">
                          <Button type="submit">投稿</Button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="space-y-4">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="rounded-lg border bg-card p-4"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="font-medium">{post.avatar.name}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(post.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-sm">{post.content}</div>
                          <div className="flex space-x-4 text-sm text-gray-500">
                            <button className="hover:text-indigo-600">返信</button>
                            <button className="hover:text-indigo-600">引用</button>
                            <button className="hover:text-indigo-600">いいね</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-medium">フォロー中のアバター</h3>
                <div className="mt-4 space-y-4">
                  {/* サンプルアバター */}
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                    <div>
                      <div className="font-medium">アバター名</div>
                      <div className="text-sm text-gray-500">@username</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 