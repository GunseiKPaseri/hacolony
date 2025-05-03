"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState, useEffect } from "react";

interface Avatar {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  posts: unknown[];
  replies: unknown[];
  quotes: unknown[];
}

export default function ProfilePage() {
  const { data: _session } = useSession();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const response = await fetch("/api/avatars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("アバターの作成に失敗しました");
      }

      setName("");
      setDescription("");
      setImageUrl("");
      fetchAvatars();
    } catch (error) {
      console.error("Error creating avatar:", error);
      setError("アバターの作成中にエラーが発生しました");
    }
  };

  return (
    <div className="container py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">プロフィール</h1>
          <p className="text-gray-500">
            アバターの作成と管理を行います。
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                アバター名
              </label>
              <input
                id="name"
                type="text"
                className="w-full rounded-md border p-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                説明
              </label>
              <textarea
                id="description"
                className="w-full rounded-md border p-2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="imageUrl" className="text-sm font-medium">
                画像URL
              </label>
              <input
                id="imageUrl"
                type="url"
                className="w-full rounded-md border p-2"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            <div>
              <Button type="submit">アバターを作成</Button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">アバター一覧</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {avatars.map((avatar) => (
              <div
                key={avatar.id}
                className="rounded-lg border bg-card p-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {avatar.imageUrl && (
                      <Image
                        src={avatar.imageUrl}
                        alt={avatar.name}
                        className="h-10 w-10 rounded-full"
                      />
                    )}
                    <div>
                      <div className="font-medium">{avatar.name}</div>
                      {avatar.description && (
                        <div className="text-sm text-gray-500">
                          {avatar.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 text-sm text-gray-500">
                    <div>投稿: {avatar.posts.length}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 