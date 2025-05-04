"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import SelfAvatar from "@/components/features/avatar/SelfAvatar";
import { PostForm } from "@/components/features/timeline/PostForm";
import { PostList } from "@/components/features/timeline/PostList";
import { usePostsAtomRefetch } from "@/state/posts";

export default function TimelinePage() {
  const refetch = usePostsAtomRefetch();
  const { data: _session } = useSession();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleSubmit = async (replyToId: string | null, content: string) => {

    if (!content.trim()) return;
    
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, replyToId }),
      });
      
      if (!response.ok) {
        throw new Error("投稿の作成に失敗しました");
      }
      
      refetch();
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
              <PostForm onSubmit={handleSubmit} error={error} />
              <PostList onReply={handleSubmit} />
            </div>

            <div className="space-y-4">
              <SelfAvatar />
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