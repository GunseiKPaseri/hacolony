"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit3,
  Save,
  X,
  Bot,
  User,
  MessageCircle,
  Users,
  UserPlus,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

interface Avatar {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  hidden: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  posts: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
  followers: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
  }>;
  followees: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
  }>;
  botConfig: {
    id: string;
    prompt: string;
  } | null;
}

interface BotConfig {
  id: string;
  prompt: string;
}

export default function AvatarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    hidden: false,
  });
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null);
  const [botPrompt, setBotPrompt] = useState("");
  const [isBotEditing, setIsBotEditing] = useState(false);
  const [avatarId, setAvatarId] = useState<string>("");

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setAvatarId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && avatarId) {
      fetchAvatar();
    }
  }, [status, avatarId, router]); // fetchAvatarはuseCallbackで包む必要があるが、現在の実装では問題ない

  const fetchAvatar = async () => {
    if (!avatarId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/avatars/${avatarId}`);

      if (response.status === 404) {
        setError("アバターが見つかりません");
        return;
      }

      if (!response.ok) {
        throw new Error("アバターの取得に失敗しました");
      }

      const data = await response.json();
      setAvatar(data);
      setEditForm({
        name: data.name,
        description: data.description || "",
        imageUrl: data.imageUrl || "",
        hidden: data.hidden,
      });
      setBotConfig(data.botConfig);
      setBotPrompt(data.botConfig?.prompt || "");
    } catch (err) {
      console.error("Error fetching avatar:", err);
      setError("アバターの取得中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/avatars/${avatarId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error("アバターの更新に失敗しました");
      }

      await fetchAvatar();
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating avatar:", err);
      setError("アバターの更新中にエラーが発生しました");
    }
  };

  const handleBotConfigSave = async () => {
    try {
      const method = botConfig ? "PUT" : "POST";
      const response = await fetch(`/api/avatars/${avatarId}/botconfig`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: botPrompt }),
      });

      if (!response.ok) {
        throw new Error("ボット設定の保存に失敗しました");
      }

      await fetchAvatar();
      setIsBotEditing(false);
    } catch (err) {
      console.error("Error saving bot config:", err);
      setError("ボット設定の保存中にエラーが発生しました");
    }
  };

  if (loading) {
    return <div className="container py-6">ロード中...</div>;
  }

  if (error) {
    return (
      <div className="container py-6">
        <div className="text-red-600">{error}</div>
        <Button onClick={() => router.back()} className="mt-4">
          戻る
        </Button>
      </div>
    );
  }

  if (!avatar) {
    return (
      <div className="container py-6">
        <div>アバターが見つかりません</div>
        <Button onClick={() => router.back()} className="mt-4">
          戻る
        </Button>
      </div>
    );
  }

  const isOwner = session?.user?.id === avatar.ownerId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              戻る
            </Button>
            {isOwner && (
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "outline" : "default"}
                className={
                  isEditing ? "" : "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                }
              >
                {isEditing ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    キャンセル
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 mr-2" />
                    編集
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>

        <div className="space-y-8">
          {/* アバター情報 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl bg-white/80 backdrop-blur-sm shadow-xl border border-white/20 p-8 dark:bg-gray-800/80 dark:border-gray-700/20"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">アバター詳細</h1>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                {isEditing ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        アバター名
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                        placeholder="アバター名を入力"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">説明</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                        rows={3}
                        placeholder="アバターの説明を入力"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">画像URL</label>
                      <input
                        type="url"
                        value={editForm.imageUrl}
                        onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <input
                        id="hidden-checkbox"
                        type="checkbox"
                        checked={editForm.hidden}
                        onChange={(e) => setEditForm({ ...editForm, hidden: e.target.checked })}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <label
                        htmlFor="hidden-checkbox"
                        className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        {editForm.hidden ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        非表示にする
                      </label>
                    </div>
                    <Button
                      onClick={handleSave}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 transform hover:scale-[1.02] shadow-lg"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      変更を保存
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {avatar.imageUrl ? (
                          <Image
                            src={avatar.imageUrl}
                            alt={avatar.name}
                            width={80}
                            height={80}
                            className="rounded-full object-cover shadow-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg">
                            <User className="h-10 w-10 text-white" />
                          </div>
                        )}
                        {avatar.botConfig && (
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{avatar.name}</h2>
                        {avatar.description && (
                          <p className="text-gray-600 dark:text-gray-400 mt-1">{avatar.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-3 text-sm">
                          <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                            <MessageCircle className="h-4 w-4" />
                            <span>作成日: {new Date(avatar.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div
                            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                              avatar.hidden
                                ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            }`}
                          >
                            {avatar.hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            <span>{avatar.hidden ? "非表示" : "表示中"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
                    統計情報
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <MessageCircle className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{avatar.posts.length}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">投稿</div>
                    </div>
                    <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <Users className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{avatar.followers.length}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">フォロワー</div>
                    </div>
                    <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <UserPlus className="w-5 h-5 text-purple-500" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{avatar.followees.length}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">フォロー中</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ボット設定 */}
          {isOwner && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl bg-white/80 backdrop-blur-sm shadow-xl border border-white/20 p-8 dark:bg-gray-800/80 dark:border-gray-700/20"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI設定</h2>
                </div>
                <Button
                  onClick={() => setIsBotEditing(!isBotEditing)}
                  variant={isBotEditing ? "outline" : "default"}
                  className={
                    isBotEditing
                      ? ""
                      : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  }
                >
                  {isBotEditing ? (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      キャンセル
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4 mr-2" />
                      {botConfig ? "編集" : "作成"}
                    </>
                  )}
                </Button>
              </div>

              {isBotEditing ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      AIプロンプト
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      このアバターの性格や話し方を詳しく設定してください
                    </p>
                    <textarea
                      value={botPrompt}
                      onChange={(e) => setBotPrompt(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      rows={6}
                      placeholder="例：あなたは明るく親しみやすい性格のAIアシスタントです。常に丁寧語で話し、ユーザーの質問に対して親切で分かりやすい回答を心がけてください。"
                    />
                  </div>
                  <Button
                    onClick={handleBotConfigSave}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 transform hover:scale-[1.02] shadow-lg"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    AI設定を保存
                  </Button>
                </div>
              ) : botConfig ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800/30">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">現在の設定:</p>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{botConfig.prompt}</p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                    <Bot className="w-4 h-4" />
                    <span>AI機能が有効です</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">AI設定が未設定です</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    AIプロンプトを設定して、このアバターを自動投稿させることができます
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* 投稿一覧 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl bg-white/80 backdrop-blur-sm shadow-xl border border-white/20 p-8 dark:bg-gray-800/80 dark:border-gray-700/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">投稿一覧</h2>
            </div>

            {avatar.posts.length > 0 ? (
              <div className="space-y-4">
                {avatar.posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30"
                  >
                    <p className="text-gray-800 dark:text-gray-200 mb-3">{post.content}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">投稿がありません</h3>
                <p className="text-gray-500 dark:text-gray-400">このアバターはまだ投稿していません</p>
              </div>
            )}
          </motion.div>

          {/* フォロー関係 */}
          <div className="grid gap-6 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-xl bg-white/80 backdrop-blur-sm shadow-xl border border-white/20 p-8 dark:bg-gray-800/80 dark:border-gray-700/20"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">フォロワー</h2>
              </div>

              {avatar.followers.length > 0 ? (
                <div className="space-y-3">
                  {avatar.followers.map((follower, index) => (
                    <motion.div
                      key={follower.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg"
                    >
                      {follower.imageUrl ? (
                        <Image
                          src={follower.imageUrl}
                          alt={follower.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">{follower.name}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">フォロワーがいません</h3>
                  <p className="text-gray-500 dark:text-gray-400">まだフォロワーがいません</p>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-xl bg-white/80 backdrop-blur-sm shadow-xl border border-white/20 p-8 dark:bg-gray-800/80 dark:border-gray-700/20"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">フォロー中</h2>
              </div>

              {avatar.followees.length > 0 ? (
                <div className="space-y-3">
                  {avatar.followees.map((followee, index) => (
                    <motion.div
                      key={followee.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg"
                    >
                      {followee.imageUrl ? (
                        <Image
                          src={followee.imageUrl}
                          alt={followee.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">{followee.name}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    フォロー中のアバターがありません
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">まだ誰もフォローしていません</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
