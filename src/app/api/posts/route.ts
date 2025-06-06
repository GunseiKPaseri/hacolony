import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { container } from "@/server/di";
import { authOptions } from "../auth/[...nextauth]/route";
import { InvalidInputError, NotFoundError } from "@/server/repository/util";
import { PostService } from "@/server/services/postService";
import { DI } from "@/server/di.type";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "認証が必要です" },
        { status: 401 }
      );
    }
    
    const postService = container.resolve<PostService>(DI.PostService);
    const posts = await postService.getPostsByUserId(session.user.id);
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

    const postService = container.resolve<PostService>(DI.PostService);
    const post = await postService.createPost({
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