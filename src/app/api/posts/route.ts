import "reflect-metadata";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { container } from "@/server/di";
import { authOptions } from "@/lib/auth";
import { InvalidInputError, NotFoundError } from "@/infrastructure/repository/util";
import { PostService } from "@/application/services/postService";
import { DI } from "@/server/di.type";
import type { Logger } from "pino";

// PostService から返される型（postedBy を含む）
type PostWithAuthor = {
  id: string;
  content: string;
  postedById: string;
  replyToId: string | null;
  quotedPostId: string | null;
  createdAt: Date;
  updatedAt: Date;
  postedBy?: {
    id: string;
    name: string;
    botConfig?: { id: string } | null;
  };
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    const postService = container.resolve<PostService>(DI.PostService);
    const posts = (await postService.getTimelinePostsByUserId(session.user.id)) as PostWithAuthor[];

    // BotConfigの存在をisBotフラグに変換
    const postsWithBotFlag = posts.map((post) => ({
      ...post,
      postedBy: post.postedBy
        ? {
            ...post.postedBy,
            isBot: !!post.postedBy.botConfig,
            botConfig: undefined, // クライアントには送信しない
          }
        : undefined,
    }));

    return NextResponse.json(postsWithBotFlag);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    const logger = container.resolve<Logger>(DI.Logger);
    logger.error({ error }, "Error fetching posts");
    return NextResponse.json({ message: "投稿の取得中にエラーが発生しました" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
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
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    const logger = container.resolve<Logger>(DI.Logger);
    logger.error({ error }, "Error creating post");
    return NextResponse.json({ message: "投稿の作成中にエラーが発生しました" }, { status: 500 });
  }
}
