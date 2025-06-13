import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { InvalidInputError, NotFoundError } from "@/server/repository/util";
import { container } from "@/server/di";
import { UserService } from "@/server/services/userService";
import { AvatarService } from "@/server/services/avatarService";
import { DI } from "@/server/di.type";
import type { Logger } from "pino";

export async function GET() {
  const logger = container.resolve<Logger>(DI.Logger);
  let session;

  try {
    session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    const userService = container.resolve<UserService>(DI.UserService);

    // SelfAvatarが存在しない場合は自動作成
    await userService.ensureSelfAvatar(session.user.id);

    const selfAvatar = await userService.getSelfAvatar(session.user.id);

    logger.debug({ userId: session.user.id, avatarId: selfAvatar?.id }, "Self avatar fetched successfully");
    return NextResponse.json(selfAvatar);
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger.warn({ userId: session?.user?.id, error: error.message }, "Self avatar not found");
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    logger.error({ userId: session?.user?.id, error }, "Error fetching self avatar");
    return NextResponse.json({ message: "アバターの取得中にエラーが発生しました" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const logger = container.resolve<Logger>(DI.Logger);
  let session;

  try {
    session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    const { name, description, imageUrl } = await request.json();

    logger.info({ userId: session.user.id, name }, "Creating self avatar");

    const avatarService = container.resolve<AvatarService>(DI.AvatarService);
    const avatar = await avatarService.createSelfAvatar({
      name,
      description,
      imageUrl,
      userId: session.user.id,
    });

    logger.info({ userId: session.user.id, avatarId: avatar.id }, "Self avatar created successfully");
    return NextResponse.json(avatar, { status: 201 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger.warn({ userId: session?.user?.id, error: error.message }, "Self avatar creation failed - not found");
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof InvalidInputError) {
      logger.warn({ userId: session?.user?.id, error: error.message }, "Self avatar creation failed - invalid input");
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    logger.error({ userId: session?.user?.id, error }, "Error creating self avatar");
    return NextResponse.json({ message: "アバターの作成中にエラーが発生しました" }, { status: 500 });
  }
}
