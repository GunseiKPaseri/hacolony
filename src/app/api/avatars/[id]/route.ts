import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { InvalidInputError, NotFoundError } from "@/infrastructure/repository/util";
import { container } from "@/server/di";
import { AvatarService } from "@/application/services/avatarService";
import { DI } from "@/server/di.type";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    const { id: avatarId } = await params;
    const avatarService = container.resolve<AvatarService>(DI.AvatarService);
    const avatar = await avatarService.getAvatarById(avatarId);

    if (!avatar) {
      return NextResponse.json({ message: "アバターが見つかりません" }, { status: 404 });
    }

    return NextResponse.json(avatar);
  } catch (error) {
    if (error instanceof InvalidInputError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: "アバターが見つかりません" }, { status: 404 });
    }
    console.error("Error fetching avatar:", error);
    console.error("Error details:", {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    return NextResponse.json({ message: "アバターの取得中にエラーが発生しました" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    const { name, description, imageUrl, hidden } = await request.json();
    const { id: avatarId } = await params;

    const avatarService = container.resolve<AvatarService>(DI.AvatarService);

    // アバターの所有者確認
    const avatar = await avatarService.getAvatarById(avatarId);
    if (!avatar || avatar.ownerId !== session.user.id) {
      return NextResponse.json({ message: "アクセス権限がありません" }, { status: 403 });
    }

    const updatedAvatar = await avatarService.updateAvatar(avatarId, {
      name,
      description,
      imageUrl,
      hidden,
    });

    if (!updatedAvatar) {
      return NextResponse.json({ message: "アバターが見つかりません" }, { status: 404 });
    }

    return NextResponse.json(updatedAvatar);
  } catch (error) {
    if (error instanceof InvalidInputError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: "アバターが見つかりません" }, { status: 404 });
    }
    console.error("Error updating avatar:", error);
    console.error("Error details:", {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    return NextResponse.json({ message: "アバターの更新中にエラーが発生しました" }, { status: 500 });
  }
}
