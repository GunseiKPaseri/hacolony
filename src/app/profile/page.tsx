"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, User, MessageCircle, Settings, Bot, ArrowLeft } from "lucide-react";

interface Avatar {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  posts: unknown[];
  replies: unknown[];
  quotes: unknown[];
  botConfig?: { id: string; prompt: string } | null;
}

export default function ProfilePage() {
  const { data: _session } = useSession();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvatars();
  }, []);

  const fetchAvatars = async () => {
    try {
      const response = await fetch("/api/avatars");
      if (!response.ok) {
        throw new Error("アバターの取得に失敗しました");
      }
      const data = await response.json();
      setAvatars(data);
    } catch (error) {
      console.error("Error fetching avatars:", error);
      setError("アバターの取得中にエラーが発生しました");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/timeline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  戻る
                </Link>
              </Button>
            </div>
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                設定
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg mb-4">
              <User className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">プロフィール</h1>
            <p className="text-gray-600 dark:text-gray-400">あなたのアバターを管理できます</p>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 dark:bg-red-950/20 dark:border-red-900/20"
          >
            <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
          </motion.div>
        )}

        {/* Create Avatar CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Link href="/avatars/create">
            <div className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-center text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
              <Plus className="mx-auto h-12 w-12 mb-3" />
              <h3 className="text-xl font-semibold mb-2">新しいアバターを作成</h3>
              <p className="text-purple-100">AIアバターを作成してあなたの分身を作りましょう</p>
            </div>
          </Link>
        </motion.div>

        {/* Avatars Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">あなたのアバター</h2>

          {avatars.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">アバターがありません</h3>
              <p className="text-gray-500 dark:text-gray-400">最初のアバターを作成してみましょう</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {avatars.map((avatar, index) => (
                <motion.div
                  key={avatar.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Link
                    href={`/avatars/${avatar.id}`}
                    className="block rounded-xl bg-white/80 backdrop-blur-sm border border-white/20 p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] dark:bg-gray-800/80 dark:border-gray-700/20"
                  >
                    <div className="space-y-4">
                      {/* Avatar Header */}
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          {avatar.imageUrl ? (
                            <Image
                              src={avatar.imageUrl}
                              alt={avatar.name}
                              width={56}
                              height={56}
                              className="rounded-full object-cover shadow-md"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center shadow-md">
                              <User className="h-7 w-7 text-white" />
                            </div>
                          )}
                          {avatar.botConfig && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                              <Bot className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {avatar.name}
                          </h3>
                          {avatar.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {avatar.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Avatar Stats */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{avatar.posts.length}</span>
                          </div>
                          {avatar.botConfig && (
                            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                              <Bot className="h-4 w-4" />
                              <span>AI</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">詳細を見る →</div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
