"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

interface PostFormProps {
  onSubmit: (replyId: string | null, content: string) => void;
  error: string | null;
}

export function PostForm({ onSubmit, error }: PostFormProps) {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(null, content);
    setContent("");
  };

  return (
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
  );
}