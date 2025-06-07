import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { InvalidInputError, NotFoundError } from "@/server/repository/util";
import { container } from "@/server/di";
import { UserService } from "@/server/services/userService";
import { AvatarService } from "@/server/services/avatarService";
import { DI } from "@/server/di.type";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    const userService = container.resolve<UserService>(DI.UserService);
    const selfAvatar = await userService.getSelfAvatar(session.user.id);

    return NextResponse.json(selfAvatar);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Error fetching avatars:", error);
    return NextResponse.json({ message: "アバターの取得中にエラーが発生しました" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    const { name, description, imageUrl } = await request.json();

    const avatarService = container.resolve<AvatarService>(DI.AvatarService);
    const avatar = await avatarService.createSelfAvatar({
      name,
      description,
      imageUrl,
      userId: session.user.id,
    });

    return NextResponse.json(avatar, { status: 201 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof InvalidInputError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Error creating avatar:", error);
    return NextResponse.json({ message: "アバターの作成中にエラーが発生しました" }, { status: 500 });
  }
}
