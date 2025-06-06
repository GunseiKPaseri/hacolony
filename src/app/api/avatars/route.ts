import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { InvalidInputError } from "@/server/repository/util";
import { container } from "@/server/di";
import { AvatarService } from "@/server/services/avatarService";
import { DI } from "@/server/di.type";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "認証が必要です" },
        { status: 401 }
      );
    }

    const avatarService = container.resolve<AvatarService>(DI.AvatarService);
    const avatars = await avatarService.getAvatarsByUserId(session.user.id);

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

    const avatarService = container.resolve<AvatarService>(DI.AvatarService);
    const avatar = await avatarService.createAvatar({
      name,
      userId: session.user.id,
      description,
      imageUrl,
      hidden: true,
    });

    return NextResponse.json(avatar, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidInputError) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }
    console.error("Error creating avatar:", error);
    return NextResponse.json(
      { message: "アバターの作成中にエラーが発生しました" },
      { status: 500 }
    );
  }
} 