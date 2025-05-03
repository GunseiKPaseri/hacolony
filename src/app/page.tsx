import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">hacolony</h1>
        <p className="text-center mb-8">
          プライベートな一人用SNSアプリ
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/login">ログイン</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/register">新規登録</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
