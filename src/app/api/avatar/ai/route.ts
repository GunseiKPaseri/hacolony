import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { InvalidInputError, NotFoundError } from "@/infrastructure/repository/util";
import { container } from "@/server/di";
import { AvatarService } from "@/application/services/avatarService";
import { DI } from "@/server/di.type";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    const { name, description, imageUrl, prompt } = await request.json();

    const avatarService = container.resolve<AvatarService>(DI.AvatarService);
    const avatar = await avatarService.createAIAvatar({
      name,
      description,
      imageUrl,
      prompt,
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
    console.error("Error creating AI avatar:", error);
    return NextResponse.json({ message: "AIアバターの作成中にエラーが発生しました" }, { status: 500 });
  }
}
