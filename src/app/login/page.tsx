"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const checkAvatar = async () => {
    try {
      const response = await fetch("/api/avatar/self");
      const avatars = await response.json();
      if (avatars.length === 0) {
        router.push("/avatars/create");
      } else {
        router.push("/timeline");
      }
    } catch (err) {
      console.error("Avatar check failed:", err);
      router.push("/timeline");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        await checkAvatar();
      }
    } catch (_e) {
      setError("ログイン中にエラーが発生しました");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
              <User className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              おかえりなさい
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              アカウントにログインしてください
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
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      placeholder="example@email.com"
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
                      autoComplete="current-password"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      placeholder="パスワードを入力"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 transform hover:scale-[1.02] shadow-lg group"
              >
                <span className="flex items-center justify-center">
                  ログイン
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
              アカウントをお持ちでない方は{" "}
              <Link 
                href="/register" 
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                新規登録
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
