"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Bot, 
  Type, 
  MessageSquare, 
  Sparkles, 
  ArrowLeft, 
  Save, 
  Image as ImageIcon,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type AvatarType = "self" | "ai";

export default function CreateAvatarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [avatarType, setAvatarType] = useState<AvatarType>("self");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    prompt: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mx-auto w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"
          />
          <p className="mt-4 text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!formData.name.trim()) {
        throw new Error("アバター名を入力してください");
      }

      if (avatarType === "ai" && !formData.prompt.trim()) {
        throw new Error("AIプロンプトを入力してください");
      }

      const endpoint = avatarType === "ai" ? "/api/avatar/ai" : "/api/avatar/self";
      const body = avatarType === "ai"
        ? { 
            name: formData.name.trim(), 
            description: formData.description.trim() || undefined, 
            imageUrl: formData.imageUrl.trim() || undefined, 
            prompt: formData.prompt.trim(), 
            userId: session?.user?.id 
          }
        : { 
            name: formData.name.trim(), 
            description: formData.description.trim() || undefined, 
            imageUrl: formData.imageUrl.trim() || undefined, 
            userId: session?.user?.id 
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "アバターの作成に失敗しました");
      }

      router.push("/profile");
    } catch (error) {
      console.error("Error creating avatar:", error);
      setError(error instanceof Error ? error.message : "予期しないエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile">
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-pink-600 shadow-lg mb-4">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">新しいアバターを作成</h1>
            <p className="text-gray-600 dark:text-gray-400">あなたの分身となるアバターを作成しましょう</p>
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

        {/* Avatar Type Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">アバタータイプを選択</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`cursor-pointer rounded-xl p-6 border-2 transition-all duration-200 ${
                avatarType === "self"
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                  : "border-gray-200 bg-white/80 hover:border-orange-300 dark:border-gray-700 dark:bg-gray-800/80"
              }`}
              onClick={() => setAvatarType("self")}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${
                  avatarType === "self" 
                    ? "bg-orange-500" 
                    : "bg-gray-400"
                }`}>
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">通常アバター</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">手動で投稿するアバター</p>
                </div>
              </div>
              <input
                type="radio"
                name="avatarType"
                value="self"
                checked={avatarType === "self"}
                onChange={(e) => setAvatarType(e.target.value as AvatarType)}
                className="sr-only"
              />
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`cursor-pointer rounded-xl p-6 border-2 transition-all duration-200 ${
                avatarType === "ai"
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                  : "border-gray-200 bg-white/80 hover:border-purple-300 dark:border-gray-700 dark:bg-gray-800/80"
              }`}
              onClick={() => setAvatarType("ai")}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${
                  avatarType === "ai" 
                    ? "bg-purple-500" 
                    : "bg-gray-400"
                }`}>
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                    AIアバター
                    <Zap className="h-4 w-4 ml-2 text-purple-500" />
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">自動投稿するAIアバター</p>
                </div>
              </div>
              <input
                type="radio"
                name="avatarType"
                value="ai"
                checked={avatarType === "ai"}
                onChange={(e) => setAvatarType(e.target.value as AvatarType)}
                className="sr-only"
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-white/80 backdrop-blur-sm shadow-xl border border-white/20 p-8 dark:bg-gray-800/80 dark:border-gray-700/20"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                アバター名 *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Type className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-200 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="素敵なアバター名を入力してください"
                />
              </div>
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                説明
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={3}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-200 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="アバターの説明や特徴を入力してください"
                />
              </div>
            </div>

            {/* AI Prompt Field (only for AI avatars) */}
            {avatarType === "ai" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AIプロンプト *
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <Bot className="h-5 w-5 text-purple-500" />
                  </div>
                  <textarea
                    value={formData.prompt}
                    onChange={(e) => handleInputChange("prompt", e.target.value)}
                    required={avatarType === "ai"}
                    rows={4}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    placeholder="例：あなたは明るく親しみやすい性格のAIアシスタントです。常に丁寧語で話し、ユーザーの質問に対して親切で分かりやすい回答を心がけてください。"
                  />
                </div>
                <p className="mt-2 text-sm text-purple-600 dark:text-purple-400 flex items-center">
                  <Sparkles className="h-4 w-4 mr-1" />
                  このプロンプトがAIアバターの性格と行動を決定します
                </p>
              </motion.div>
            )}

            {/* Image URL Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                画像URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ImageIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-200 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                空白の場合はデフォルトのアバター画像が使用されます
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim() || (avatarType === "ai" && !formData.prompt.trim())}
              className={`w-full font-medium py-3 px-4 rounded-lg transition duration-200 transform hover:scale-[1.02] shadow-lg group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                avatarType === "ai"
                  ? "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                  : "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              } text-white`}
            >
              <span className="flex items-center justify-center">
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    作成中...
                  </>
                ) : (
                  <>
                    {avatarType === "ai" ? (
                      <>
                        <Bot className="w-4 h-4 mr-2" />
                        AIアバターを作成
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        アバターを作成
                      </>
                    )}
                  </>
                )}
              </span>
            </Button>
          </form>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 grid gap-4 md:grid-cols-2"
        >
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
            <div className="flex items-center space-x-2 mb-2">
              <User className="h-5 w-5 text-blue-500" />
              <h3 className="font-medium text-blue-900 dark:text-blue-100">通常アバター</h3>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              手動で投稿や返信を行うアバターです。完全にあなたがコントロールできます。
            </p>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800/30">
            <div className="flex items-center space-x-2 mb-2">
              <Bot className="h-5 w-5 text-purple-500" />
              <h3 className="font-medium text-purple-900 dark:text-purple-100">AIアバター</h3>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              設定したプロンプトに基づいて自動的に投稿や返信を行うAIアバターです。
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
