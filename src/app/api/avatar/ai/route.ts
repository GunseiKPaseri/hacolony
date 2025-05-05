import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { InvalidInputError, NotFoundError } from "@/server/repository/util";
import { transaction } from "@/server/repository/repository";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "認証が必要です" },
        { status: 401 }
      );
    }

    const { name, description, imageUrl, prompt } = await request.json();

    // トランザクションでアバターとBotConfigを作成
    const avatar = await transaction(async ({ txAvatarRepository, txBotConfigRepository, txFollowRepository, txUserRepository }) => {
      // アバター作成
      const avatar = await txAvatarRepository.createAvatar({
        name,
        description,
        imageUrl,
        userId: session.user.id,
        hidden: true,
      });

      // BotConfig作成
      await txBotConfigRepository.createBotConfig({
        prompt,
        avatarId: avatar.id,
      });

      // 自己アバター取得
      const selfAvatar = await txUserRepository.getAvatar(session.user.id);

      if (!selfAvatar) {
        throw new NotFoundError("アバターが見つかりません");
      }

      await txFollowRepository.followAvatar([
        // 新規アバターが自己アバターをフォロー
        {
          followerId: avatar.id,
          followingId: selfAvatar.id,
        },
        // 自己アバターが新規アバターをフォロー
        {
          followerId: selfAvatar.id,
          followingId: avatar.id,
        },
      ]);

      return avatar;
    });
    return NextResponse.json(avatar, { status: 201 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { message: error.message },
        { status: 404 }
      );
    }
    if (error instanceof InvalidInputError) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }
    console.error("Error creating AI avatar:", error);
    return NextResponse.json(
      { message: "AIアバターの作成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}