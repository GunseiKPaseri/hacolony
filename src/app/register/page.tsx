"use client";

import { Button } from "@/components/ui/button";
import { AvatarForm, type AvatarFormData } from "@/components/features/auth/AvatarForm";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">新規登録</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                名前
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={userName}
                onChange={handleNameChange}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="山田太郎"
              />
            </div>

            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="yamada@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="6文字以上のパスワード"
              />
            </div>

            <AvatarForm defaultName={userName} onAvatarChange={setAvatarData} className="pt-2" />
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "登録中..." : "登録"}
            </Button>
          </div>
        </form>

        <div className="text-center">
          <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-500">
            すでにアカウントをお持ちの方はこちら
          </Link>
        </div>
      </div>
    </div>
  );
}
