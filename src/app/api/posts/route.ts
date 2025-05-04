import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { InvalidInputError, NotFoundError } from "@/server/repository/util";
import { dbPostRepository } from "@/server/repository/repository";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "認証が必要です" },
        { status: 401 }
      );
    }
    const posts = await dbPostRepository.getPostsByUserId(session.user.id);
    return NextResponse.json(posts);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { message: error.message },
        { status: 404 }
      );
    }

    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { message: "投稿の取得中にエラーが発生しました" },
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

    const { content, replyToId } = await request.json();

    const post = await dbPostRepository.createPostByUserId({
      content,
      postedByUserId: session.user.id,
      replyToId: replyToId || null,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidInputError) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { message: error.message },
        { status: 404 }
      );
    }
    console.error("Error creating post:", error);
    return NextResponse.json(
      { message: "投稿の作成中にエラーが発生しました" },
      { status: 500 }
    );
  }
} 