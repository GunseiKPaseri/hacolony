"use client";

import { Button } from "@/components/ui/button";
import { AvatarForm, type AvatarFormData } from "@/components/features/auth/AvatarForm";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, UserPlus, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarData, setAvatarData] = useState<AvatarFormData>({
    name: "",
    description: "",
    imageUrl: "",
  });
  const [userName, setUserName] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // アバター名のバリデーション
      if (!avatarData.name.trim()) {
        throw new Error("アバター名を入力してください");
      }

      const requestBody = {
        name,
        email,
        password,
        avatar: {
          name: avatarData.name.trim(),
          description: avatarData.description.trim() || undefined,
          imageUrl: avatarData.imageUrl.trim() || undefined,
        },
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      router.push("/login");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("登録中にエラーが発生しました");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg space-y-8"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-teal-600 shadow-lg">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              アカウント作成
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              新しいアカウントを作成してはじめましょう
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="rounded-xl bg-white/80 backdrop-blur-sm shadow-xl border border-white/20 p-8 dark:bg-gray-800/80 dark:border-gray-700/20"
          >
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-lg bg-red-50 p-4 border border-red-200 dark:bg-red-950/20 dark:border-red-900/20"
                >
                  <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
                </motion.div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    お名前
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={userName}
                      onChange={handleNameChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      placeholder="山田太郎"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    メールアドレス
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      placeholder="yamada@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    パスワード
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      placeholder="6文字以上のパスワード"
                    />
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="pt-2"
                >
                  <AvatarForm defaultName={userName} onAvatarChange={setAvatarData} className="space-y-4" />
                </motion.div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 transform hover:scale-[1.02] shadow-lg group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="flex items-center justify-center">
                  {isLoading ? "登録中..." : "アカウント作成"}
                  {!isLoading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                </span>
              </Button>
            </form>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              すでにアカウントをお持ちの方は{" "}
              <Link 
                href="/login" 
                className="font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 transition-colors"
              >
                ログイン
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
