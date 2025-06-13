"use client";

import { Suspense, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { PostItem } from "./PostItem";
import { usePostsAtomValue, usePostsAtomRefetch } from "@/stores/posts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PostListProps {
  onReply: (postId: string, content: string) => void;
}

const PostListCore: React.FC<PostListProps> = ({ onReply }) => {
  const posts = usePostsAtomValue();
  const refetch = usePostsAtomRefetch();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.visibilityState === "visible" && isOnline) {
        try {
          await refetch();
          setLastRefresh(new Date());
        } catch (error) {
          console.error("Auto-refresh failed:", error);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [refetch, isOnline]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Manual refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-0">
      {/* Header with refresh button and status */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/40 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">タイムライン</h2>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {isOnline ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
              <span className="text-xs">最終更新: {lastRefresh.toLocaleTimeString()}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={cn("h-8 w-8 p-0", isRefreshing && "animate-spin")}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Posts */}
      <div className="min-h-screen">
        <AnimatePresence mode="popLayout">
          {posts && posts.length > 0 ? (
            posts.map((post, index) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                }}
              >
                <PostItem post={post} onReply={onReply} depth={0} />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-muted mb-4 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">投稿がありません</h3>
              <p className="text-muted-foreground mb-4">最初の投稿をしてみましょう！</p>
              <Button onClick={handleManualRefresh} disabled={isRefreshing}>
                {isRefreshing ? "読み込み中..." : "更新"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export function PostList({ onReply }: PostListProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          {/* Loading skeleton */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-b border-border/40 p-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-4 w-full bg-muted rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="flex gap-4 pt-2">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="h-6 w-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    >
      <PostListCore onReply={onReply} />
    </Suspense>
  );
}
