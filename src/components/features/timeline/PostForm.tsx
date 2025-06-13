"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, MapPin, Smile, Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostFormProps {
  onSubmit: (replyId: string | null, content: string) => void;
  error: string | null;
}

export function PostForm({ onSubmit, error }: PostFormProps) {
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(null, content);
      setContent("");
      setIsExpanded(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextareaClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleCancel = () => {
    setContent("");
    setIsExpanded(false);
  };

  const characterLimit = 280;
  const remainingChars = characterLimit - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-border/40 bg-card"
    >
      <div className="p-4">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/20"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            {/* Avatar placeholder */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />

            {/* Input area */}
            <div className="flex-1">
              <textarea
                className={cn(
                  "w-full resize-none border-none bg-transparent placeholder:text-muted-foreground focus:outline-none text-lg",
                  !isExpanded && "cursor-pointer",
                )}
                placeholder="いまどうしてる？"
                rows={isExpanded ? 4 : 1}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onClick={handleTextareaClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !isOverLimit && content.trim()) {
                    handleSubmit(e);
                  }
                }}
              />

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3"
                  >
                    {/* Media options */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                          disabled
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                          disabled
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                          disabled
                        >
                          <Smile className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                          disabled
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Character count */}
                        {content.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "text-sm",
                                remainingChars < 20 && remainingChars >= 0 && "text-yellow-600",
                                isOverLimit && "text-red-600",
                              )}
                            >
                              {remainingChars}
                            </div>
                            <div className="w-8 h-8 relative">
                              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                                <circle
                                  cx="16"
                                  cy="16"
                                  r="14"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  fill="none"
                                  className="text-muted-foreground/20"
                                />
                                <circle
                                  cx="16"
                                  cy="16"
                                  r="14"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  fill="none"
                                  strokeDasharray={`${(content.length / characterLimit) * 87.96} 87.96`}
                                  className={cn(
                                    "transition-colors",
                                    remainingChars >= 20 && "text-blue-500",
                                    remainingChars < 20 && remainingChars >= 0 && "text-yellow-500",
                                    isOverLimit && "text-red-500",
                                  )}
                                />
                              </svg>
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                            キャンセル
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={!content.trim() || isOverLimit || isSubmitting}
                            className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                          >
                            {isSubmitting ? "投稿中..." : "投稿"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
