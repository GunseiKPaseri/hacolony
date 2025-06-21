import "reflect-metadata";
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

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json({ message: "現在のパスワードを入力してください" }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json({ message: "新しいパスワードを入力してください" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: "新しいパスワードは6文字以上である必要があります" }, { status: 400 });
    }

    const userService = container.resolve<UserService>(DI.UserService);
    await userService.updateUserPassword(session.user.id, currentPassword, newPassword);

    return NextResponse.json({ message: "パスワードを更新しました" });
  } catch (error) {
    if (error instanceof InvalidInputError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    const logger = container.resolve<Logger>(DI.Logger);
    logger.error({ error }, "Error updating user password");
    return NextResponse.json({ message: "パスワードの更新中にエラーが発生しました" }, { status: 500 });
  }
}
