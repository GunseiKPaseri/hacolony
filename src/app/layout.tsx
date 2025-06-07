import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "hacolony",
  description: "プライベートな一人用SNSアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            <div className="container mx-auto max-w-4xl px-4 py-8">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
