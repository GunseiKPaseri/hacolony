"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

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
    <div className="container py-6">
      <div className="space-y-6">
        {/* アバター情報 */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">アバター詳細</h1>
            {isOwner && (
              <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "outline" : "default"}>
                {isEditing ? "キャンセル" : "編集"}
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">名前</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">説明</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full p-2 border rounded"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">画像URL</label>
                    <input
                      type="url"
                      value={editForm.imageUrl}
                      onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editForm.hidden}
                        onChange={(e) => setEditForm({ ...editForm, hidden: e.target.checked })}
                        className="mr-2"
                      />
                      非表示にする
                    </label>
                  </div>
                  <Button onClick={handleSave}>保存</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    {avatar.imageUrl && (
                      <Image
                        src={avatar.imageUrl}
                        alt={avatar.name}
                        width={64}
                        height={64}
                        className="rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h2 className="text-xl font-semibold">{avatar.name}</h2>
                      {avatar.description && <p className="text-gray-600">{avatar.description}</p>}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>作成日: {new Date(avatar.createdAt).toLocaleDateString()}</p>
                    <p>状態: {avatar.hidden ? "非表示" : "表示中"}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium">統計</h3>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{avatar.posts.length}</div>
                    <div className="text-sm text-gray-500">投稿</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{avatar.followers.length}</div>
                    <div className="text-sm text-gray-500">フォロワー</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{avatar.followees.length}</div>
                    <div className="text-sm text-gray-500">フォロー中</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ボット設定 */}
        {isOwner && (
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">ボット設定</h2>
              <Button onClick={() => setIsBotEditing(!isBotEditing)} variant={isBotEditing ? "outline" : "default"}>
                {isBotEditing ? "キャンセル" : botConfig ? "編集" : "作成"}
              </Button>
            </div>

            {isBotEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">AIプロンプト</label>
                  <textarea
                    value={botPrompt}
                    onChange={(e) => setBotPrompt(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={4}
                    placeholder="AIアバターのキャラクター設定プロンプトを入力してください"
                  />
                </div>
                <Button onClick={handleBotConfigSave}>保存</Button>
              </div>
            ) : botConfig ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">AIプロンプト:</p>
                <p className="bg-gray-50 p-3 rounded">{botConfig.prompt}</p>
              </div>
            ) : (
              <p className="text-gray-500">ボット設定が設定されていません</p>
            )}
          </div>
        )}

        {/* 投稿一覧 */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">投稿一覧</h2>
          {avatar.posts.length > 0 ? (
            <div className="space-y-4">
              {avatar.posts.map((post) => (
                <div key={post.id} className="border-b pb-4 last:border-b-0">
                  <p className="mb-2">{post.content}</p>
                  <p className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">投稿がありません</p>
          )}
        </div>

        {/* フォロー関係 */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">フォロワー</h2>
            {avatar.followers.length > 0 ? (
              <div className="space-y-2">
                {avatar.followers.map((follower) => (
                  <div key={follower.id} className="flex items-center space-x-2">
                    {follower.imageUrl && (
                      <Image
                        src={follower.imageUrl}
                        alt={follower.name}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    )}
                    <span>{follower.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">フォロワーがいません</p>
            )}
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">フォロー中</h2>
            {avatar.followees.length > 0 ? (
              <div className="space-y-2">
                {avatar.followees.map((followee) => (
                  <div key={followee.id} className="flex items-center space-x-2">
                    {followee.imageUrl && (
                      <Image
                        src={followee.imageUrl}
                        alt={followee.name}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    )}
                    <span>{followee.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">フォローしているアバターがいません</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
