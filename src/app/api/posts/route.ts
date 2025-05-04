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

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        selfAvatar: true,
      },
    });

    if (!user?.selfAvatar || user?.selfAvatarId === null) {
      return NextResponse.json(
        { message: "アバターが見つかりません" },
        { status: 404 }
      );
    }

    const posts = await prisma.post.findMany({
      where: {
        postedById: user.selfAvatarId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        postedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { message: "投稿の取得中にエラーが発生しました" },
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

    const { content, replyToId } = await request.json();

    if (!content) {
      return NextResponse.json(
        { message: "投稿内容を入力してください" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        selfAvatar: true,
      },
    });

    if (!user?.selfAvatar) {
      return NextResponse.json(
        { message: "アバターが見つかりません" },
        { status: 404 }
      );
    }

    // 投稿作成時にリプライ先の存在を検証
    if (replyToId) {
      const parentPost = await prisma.post.findUnique({
        where: { id: replyToId },
      });
      
      if (!parentPost) {
        return NextResponse.json(
          { message: "リプライ先の投稿が存在しません" },
          { status: 404 }
        );
      }
    }

    const post = await prisma.post.create({
      data: {
        content,
        postedById: user.selfAvatar.id,
        replyToId: replyToId || null,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { message: "投稿の作成中にエラーが発生しました" },
      { status: 500 }
    );
  }
} 