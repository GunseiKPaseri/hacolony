import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { container } from "@/server/di";
import { authOptions } from "@/lib/auth";
import { UserService } from "@/application/services/userService";
import { DI } from "@/server/di.type";
import { InvalidInputError, NotFoundError } from "@/infrastructure/repository/util";
import type { Logger } from "pino";

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ message: "ユーザー名を入力してください" }, { status: 400 });
    }

    if (name.trim().length > 50) {
      return NextResponse.json({ message: "ユーザー名は50文字以内で入力してください" }, { status: 400 });
    }

    const userService = container.resolve<UserService>(DI.UserService);
    const updatedUser = await userService.updateUserProfile(session.user.id, {
      name: name.trim(),
    });

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
    });
  } catch (error) {
    if (error instanceof InvalidInputError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    const logger = container.resolve<Logger>(DI.Logger);
    logger.error({ error }, "Error updating user profile");
    return NextResponse.json({ message: "ユーザー情報の更新中にエラーが発生しました" }, { status: 500 });
  }
}
