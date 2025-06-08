"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AvatarType = "self" | "ai";

export default function CreateAvatarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [avatarType, setAvatarType] = useState<AvatarType>("self");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>ロード中...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name");
    const description = formData.get("description");
    const imageUrl = formData.get("imageUrl");
    const prompt = formData.get("prompt");

    const endpoint = avatarType === "ai" ? "/api/avatar/ai" : "/api/avatar/self";
    const body = avatarType === "ai" 
      ? { name, description, imageUrl, prompt, userId: session?.user?.id }
      : { name, description, imageUrl, userId: session?.user?.id };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      router.push("/timeline");
    } else {
      alert(`${avatarType === "ai" ? "AI" : ""}アバターの作成に失敗しました`);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6">アバターを作成</h1>
      
      {/* アバタータイプ選択 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3">アバタータイプ</label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="avatarType"
              value="self"
              checked={avatarType === "self"}
              onChange={(e) => setAvatarType(e.target.value as AvatarType)}
              className="mr-2"
            />
            <span>通常アバター</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="avatarType"
              value="ai"
              checked={avatarType === "ai"}
              onChange={(e) => setAvatarType(e.target.value as AvatarType)}
              className="mr-2"
            />
            <span>AIアバター</span>
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">名前</label>
          <input type="text" name="name" required className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">説明</label>
          <textarea name="description" className="w-full p-2 border rounded"></textarea>
        </div>
        
        {/* AIアバター選択時のみプロンプトフィールドを表示 */}
        {avatarType === "ai" && (
          <div>
            <label className="block text-sm font-medium mb-1">プロンプト</label>
            <textarea
              name="prompt"
              required
              className="w-full p-2 border rounded"
              placeholder="AIアバターのキャラ設定プロンプトを入力"
              rows={3}
            ></textarea>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-1">画像URL</label>
          <input type="text" name="imageUrl" className="w-full p-2 border rounded" />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          {avatarType === "ai" ? "AIアバターを作成" : "アバターを作成"}
        </button>
      </form>
    </div>
  );
}
