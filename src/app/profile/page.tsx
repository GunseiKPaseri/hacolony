"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
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
    <div className="container py-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">プロフィール</h1>
            <p className="text-gray-500">アバターの作成と管理を行います。</p>
          </div>
          <Link href="/avatars/create">
            <Button>新しいアバターを作成</Button>
          </Link>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-bold">アバター一覧</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {avatars.map((avatar) => (
              <Link
                key={avatar.id}
                href={`/avatars/${avatar.id}`}
                className="rounded-lg border bg-card p-4 block hover:bg-gray-50 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {avatar.imageUrl && (
                      <Image src={avatar.imageUrl} alt={avatar.name} width={40} height={40} className="rounded-full object-cover" />
                    )}
                    <div>
                      <div className="font-medium">{avatar.name}</div>
                      {avatar.description && <div className="text-sm text-gray-500">{avatar.description}</div>}
                    </div>
                  </div>
                  <div className="flex space-x-2 text-sm text-gray-500">
                    <div>投稿: {avatar.posts.length}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
