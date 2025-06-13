"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { User, Lock, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ユーザー名変更フォーム
  const [username, setUsername] = useState(session?.user?.name || "");
  const [isUsernameChanged, setIsUsernameChanged] = useState(false);

  // パスワード変更フォーム
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setIsUsernameChanged(value !== session?.user?.name);
  };

  const handleUpdateUsername = async () => {
    if (!username.trim() || username === session?.user?.name) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: username.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "ユーザー名の更新に失敗しました");
      }

      await update({ name: username.trim() });
      setIsUsernameChanged(false);
      setMessage({ type: "success", text: "ユーザー名を更新しました" });
    } catch (error) {
      console.error("Error updating username:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "ユーザー名の更新中にエラーが発生しました",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "すべてのパスワードフィールドを入力してください" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "新しいパスワードが一致しません" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "新しいパスワードは6文字以上である必要があります" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "パスワードの更新に失敗しました");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "パスワードを更新しました" });
    } catch (error) {
      console.error("Error updating password:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "パスワードの更新中にエラーが発生しました",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/timeline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">設定</h1>
          <p className="text-muted-foreground mt-2">アカウント設定を管理できます</p>
        </motion.div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mb-6 p-4 rounded-lg border",
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-900/20 dark:text-green-400"
                : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900/20 dark:text-red-400",
            )}
          >
            {message.text}
          </motion.div>
        )}

        <div className="space-y-8">
          {/* ユーザー名変更 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border/40 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">ユーザー名</h2>
                <p className="text-sm text-muted-foreground">表示名を変更できます</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-2">
                  ユーザー名
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-border/40 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="ユーザー名を入力"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleUpdateUsername}
                  disabled={!isUsernameChanged || isLoading}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "更新中..." : "保存"}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* パスワード変更 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border/40 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">パスワード</h2>
                <p className="text-sm text-muted-foreground">セキュリティのためパスワードを変更できます</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
                  現在のパスワード
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-border/40 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="現在のパスワードを入力"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                  新しいパスワード
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-border/40 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="新しいパスワードを入力（6文字以上）"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  新しいパスワード（確認）
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-border/40 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="新しいパスワードを再入力"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleUpdatePassword}
                  disabled={!currentPassword || !newPassword || !confirmPassword || isLoading}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "更新中..." : "パスワードを変更"}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* アカウント情報 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border/40 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4">アカウント情報</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">メールアドレス</span>
                <span>{session?.user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ユーザーID</span>
                <span className="font-mono text-xs">{session?.user?.id}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
