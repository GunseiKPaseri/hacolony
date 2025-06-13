"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Home, User, Settings, LogOut, Bell, Search, Menu } from "lucide-react";
import SelfAvatar from "@/components/features/avatar/SelfAvatar";
import { PostForm } from "@/components/features/timeline/PostForm";
import { PostList } from "@/components/features/timeline/PostList";
import { usePostsAtomRefetch } from "@/stores/posts";
import { cn } from "@/lib/utils";

export default function TimelinePage() {
  const refetch = usePostsAtomRefetch();
  const { data: session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleSubmit = async (replyToId: string | null, content: string) => {
    if (!content.trim()) return;

    setError(null);
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

  const navigationItems = [
    { href: "/timeline", label: "ホーム", icon: Home, active: true },
    { href: "/search", label: "検索", icon: Search, active: false },
    { href: "/notifications", label: "通知", icon: Bell, active: false },
    { href: "/profile", label: "プロフィール", icon: User, active: false },
    { href: "/settings", label: "設定", icon: Settings, active: false },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 md:hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="flex items-center justify-between px-4 h-14">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8 p-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/timeline" className="font-bold text-xl">
            hacolony
          </Link>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="flex max-w-none mx-auto">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 bg-background border-r border-border/40 transform transition-transform duration-200 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-border/40 hidden md:block">
              <Link href="/timeline" className="font-bold text-2xl">
                hacolony
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {navigationItems.map((item) => (
                <Button
                  key={item.href}
                  variant={item.active ? "default" : "ghost"}
                  asChild
                  className={cn(
                    "w-full justify-start h-12 text-lg",
                    item.active && "bg-primary text-primary-foreground"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="mr-4 h-6 w-6" />
                    {item.label}
                  </Link>
                </Button>
              ))}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-border/40">
              {session && (
                <div className="mb-4">
                  <SelfAvatar />
                </div>
              )}
              <Button variant="outline" asChild className="w-full">
                <Link href="/logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </Link>
              </Button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto border-x border-border/40 min-h-screen">
            {/* Post Form */}
            <PostForm onSubmit={handleSubmit} error={error} />
            
            {/* Timeline */}
            <PostList onReply={handleSubmit} />
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="hidden xl:block w-80 p-6 space-y-6">
          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-muted/50 p-4"
          >
            <h3 className="font-semibold mb-3">検索</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="hacolonyを検索"
                className="w-full pl-10 pr-4 py-2 rounded-full bg-background border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </motion.div>

          {/* Trending */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-muted/50 p-4"
          >
            <h3 className="font-semibold mb-3">トレンド</h3>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="text-sm text-muted-foreground">トレンド #{i + 1}</div>
                  <div className="font-medium">#サンプルタグ{i + 1}</div>
                  <div className="text-sm text-muted-foreground">{Math.floor(Math.random() * 1000)}件の投稿</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Suggested Follows */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-muted/50 p-4"
          >
            <h3 className="font-semibold mb-3">おすすめアバター</h3>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                    <div>
                      <div className="font-medium">アバター{i + 1}</div>
                      <div className="text-sm text-muted-foreground">@avatar{i + 1}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    フォロー
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        </aside>
      </div>
    </div>
  );
}