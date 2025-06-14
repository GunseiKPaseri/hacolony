"use client";
import type { Post } from "@/domain/post/entity";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Repeat2, Heart, Share, MoreHorizontal, Bot } from "lucide-react";
import AvatarIcon from "../avatar/AvatarIcon";
import IDText from "@/components/ui/IDText";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PostItemProps {
  post: Post;
  onReply: (postId: string, content: string) => void;
  isReply?: boolean;
  depth?: number;
}

export function PostItem({ post, onReply, isReply = false, depth = 0 }: PostItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);

  const handleSubmitReply = () => {
    if (!replyContent.trim()) return;
    onReply(post.id, replyContent);
    setShowReplyForm(false);
    setReplyContent("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative",
        depth === 0 && "border-b border-border/40 hover:bg-muted/20 transition-colors",
        depth > 0 && "ml-6 border-l border-border/40 pl-4",
      )}
    >
      <div className="flex gap-3 p-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <AvatarIcon avatar={post.postedBy} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <h4 className="font-semibold text-foreground hover:underline cursor-pointer">{post.postedBy.name}</h4>
              {post.postedBy.isBot && (
                <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                  <Bot className="w-3 h-3 mr-1" />
                  Bot
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              <IDText id={post.postedBy.id} />
            </div>
            <span className="text-muted-foreground">·</span>
            <time className="text-sm text-muted-foreground hover:underline cursor-pointer">
              {formatRelativeTime(post.createdAt)}
            </time>
            {isReply && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                返信
              </span>
            )}
          </div>

          {/* Post Content */}
          <div className="text-foreground mb-3 whitespace-pre-wrap break-words">{post.content}</div>

          {/* Actions */}
          <div className="flex items-center justify-between max-w-md">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20",
                showReplyForm && "text-blue-600 bg-blue-50 dark:bg-blue-950/20",
              )}
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              <span className="text-sm">{post.replies?.length || 0}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2 text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20",
                isReposted && "text-green-600 bg-green-50 dark:bg-green-950/20",
              )}
              onClick={() => setIsReposted(!isReposted)}
            >
              <Repeat2 className="w-4 h-4 mr-1" />
              <span className="text-sm">0</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20",
                isLiked && "text-red-600 bg-red-50 dark:bg-red-950/20",
              )}
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={cn("w-4 h-4 mr-1", isLiked && "fill-current")} />
              <span className="text-sm">0</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
            >
              <Share className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>

          {/* Reply Form */}
          <AnimatePresence>
            {showReplyForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 pt-3 border-t border-border/40"
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1">
                    <textarea
                      className="w-full resize-none border-none bg-transparent placeholder:text-muted-foreground focus:outline-none text-lg"
                      placeholder="返信を投稿"
                      rows={2}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          handleSubmitReply();
                        }
                      }}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-sm text-muted-foreground">{replyContent.length}/280</div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowReplyForm(false);
                            setReplyContent("");
                          }}
                        >
                          キャンセル
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSubmitReply}
                          disabled={!replyContent.trim() || replyContent.length > 280}
                        >
                          返信
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Replies */}
          {post.replies && post.replies.length > 0 && (
            <div className="mt-3">
              {post.replies
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((reply) => (
                  <PostItem key={reply.id} post={reply} onReply={onReply} isReply={true} depth={depth + 1} />
                ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
