import { NextResponse } from "next/server";
import { InvalidInputError } from "@/server/repository/util";
import { container } from "@/server/di";
import { UserService } from "@/server/services/userService";
import { DI } from "@/server/di.type";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    const userService = container.resolve<UserService>(DI.UserService);

    await userService.createUser({
      name,
      email,
      password,
    });

    return NextResponse.json({ message: "ユーザー登録が完了しました" }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidInputError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Registration error:", error);
    return NextResponse.json({ message: "ユーザー登録中にエラーが発生しました" }, { status: 500 });
  }
}
