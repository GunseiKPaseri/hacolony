import { NextResponse } from "next/server";
import { InvalidInputError } from "@/server/repository/util";
import { dbUserRepository } from "@/server/repository/repository";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "必要な情報が不足しています" },
        { status: 400 }
      );
    }

    await dbUserRepository.createUser({
      name,
      email,
      password,
    });

    return NextResponse.json(
      { message: "ユーザー登録が完了しました" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof InvalidInputError) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "ユーザー登録中にエラーが発生しました" },
      { status: 500 }
    );
  }
} 