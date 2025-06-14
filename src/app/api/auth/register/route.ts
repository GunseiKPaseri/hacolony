import { NextResponse } from "next/server";
import { InvalidInputError } from "@/infrastructure/repository/util";
import { container } from "@/server/di";
import { UserService } from "@/application/services/userService";
import { DI } from "@/server/di.type";
import type { Logger } from "pino";

export async function POST(request: Request) {
  const logger = container.resolve<Logger>(DI.Logger);

  try {
    const { name, email, password, avatar } = await request.json();

    logger.info({ name, email, avatarName: avatar?.name }, "Starting user registration");

    const userService = container.resolve<UserService>(DI.UserService);

    await userService.createUser({
      name,
      email,
      password,
      avatar,
    });

    logger.info({ name, email }, "User registration completed successfully");
    return NextResponse.json({ message: "ユーザー登録が完了しました" }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidInputError) {
      logger.warn({ error: error.message }, "User registration failed due to invalid input");
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    logger.error({ error }, "User registration failed with unexpected error");
    return NextResponse.json({ message: "ユーザー登録中にエラーが発生しました" }, { status: 500 });
  }
}
