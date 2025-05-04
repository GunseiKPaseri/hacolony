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
        selfAvatar: true
      },
    });

    if (!user?.selfAvatar) {
      return NextResponse.json(
        { message: "アバターが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(user.selfAvatar);
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
    const prevuser = await prisma.user.findUnique({
      select: {
        selfAvatarId: true,
      },
      where: {
        id: session.user.id,
      },
    });

    if (prevuser?.selfAvatarId) {
      return NextResponse.json(
        { message: "アバターは既に存在します" },
        { status: 400 }
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
        ownerId: session.user.id,
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
        ownerId: session.user.id,
        hidden: true,
      },
    });
    const _user = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        selfAvatarId: avatar.id,
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