import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { InvalidInputError, NotFoundError } from "@/server/repository/util";
import { dbUserRepository, transaction } from "@/server/repository/repository";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "認証が必要です" },
        { status: 401 }
      );
    }

    const user = await dbUserRepository.getUserByIdWithAvatar(session.user.id);

    return NextResponse.json(user.selfAvatar);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { message: error.message },
        { status: 404 }
      );
    }
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

    if (await dbUserRepository.hasAvatar(session.user.id)) {
      return NextResponse.json(
        { message: "アバターは既に存在します" },
        { status: 400 }
      );
    }

    const { name, description, imageUrl } = await request.json();

    // トランザクションでアバターとBotConfigを作成
    const avatar = await transaction(async ({txFollowRepository, txUserRepository}) => {
      // アバター作成
      const avatar = await txUserRepository.createSelfAvatar({
        name,
        description,
        imageUrl,
        userId: session.user.id,
        hidden: true,
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
    console.error("Error creating avatar:", error);
    return NextResponse.json(
      { message: "アバターの作成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}