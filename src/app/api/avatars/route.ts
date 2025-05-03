import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "認証が必要です" },
        { status: 401 }
      );
    }

    const avatars = await prisma.avatar.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        posts: true,
        replies: true,
        quotes: true,
      },
    });

    return NextResponse.json(avatars);
  } catch (error) {
    console.error("Error fetching avatars:", error);
    return NextResponse.json(
      { message: "アバターの取得中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "認証が必要です" },
        { status: 401 }
      );
    }

    const { name, description, imageUrl } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: "アバター名を入力してください" },
        { status: 400 }
      );
    }

    const existingAvatar = await prisma.avatar.findFirst({
      where: {
        userId: session.user.id,
        name,
      },
    });

    if (existingAvatar) {
      return NextResponse.json(
        { message: "この名前のアバターは既に存在します" },
        { status: 400 }
      );
    }

    const avatar = await prisma.avatar.create({
      data: {
        name,
        description,
        imageUrl,
        userId: session.user.id,
        hidden: true,
      },
    });

    return NextResponse.json(avatar, { status: 201 });
  } catch (error) {
    console.error("Error creating avatar:", error);
    return NextResponse.json(
      { message: "アバターの作成中にエラーが発生しました" },
      { status: 500 }
    );
  }
} 