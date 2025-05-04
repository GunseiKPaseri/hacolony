import type { PrismaClient } from "@/generated/client";
import type { PostRepository } from "./interface";
import { prisma } from "../prisma/prisma";
import { InvalidInputError, NotFoundError } from "./util";

export default class DBPostRepository implements PostRepository {
  constructor(private prisma: PrismaClient) {}

  async getPostsByUserId(userId: string) {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        selfAvatar: true,
      },
    });

    if (!user?.selfAvatar || user?.selfAvatarId === null) {
      throw new NotFoundError("アバターが見つかりません");
    }

    const posts = await prisma.post.findMany({
      where: {
        postedById: user.selfAvatarId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        postedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return posts;
  }

  private async createPost(props: {content: string, postedByAvatarId: string, replyToId: string | null}) {

    if(!props.content) {
      throw new InvalidInputError("投稿内容を入力してください");
    }

    console.log("createPost", props);

    // 投稿作成時にリプライ先の存在を検証
    if (props.replyToId) {
      const parentPost = await prisma.post.findUnique({
        where: { id: props.replyToId },
      });
      
      if (!parentPost) {
        throw new NotFoundError("リプライ先の投稿が存在しません");
      }
    }

    return this.prisma.post.create({
      data: {
        content: props.content,
        postedById: props.postedByAvatarId,
        replyToId: props.replyToId ?? null,
      },
    });
  }

  async createPostByAvatarId(props: {content: string, postedByAvatarId: string, replyToId: string | null}) {
    const avatar = await prisma.avatar.findUnique({
      select: {
        id: true,
      },
      where: {
        id: props.postedByAvatarId,
      },
    });
    if (!avatar) {
      throw new NotFoundError("アバターが見つかりません");
    }
    return this.createPost({
      content: props.content,
      postedByAvatarId: avatar.id,
      replyToId: props.replyToId,
    });
  }

  async createPostByUserId(props: {content: string, postedByUserId: string, replyToId: string | null}) {
    const user = await prisma.user.findUnique({
      where: {
        id: props.postedByUserId,
      },
      include: {
        selfAvatar: true,
      },
    });

    if (!user?.selfAvatar) {
      throw new NotFoundError("アバターが見つかりません");
    }

    return this.createPost({
      content: props.content,
      postedByAvatarId: user.selfAvatar.id,
      replyToId: props.replyToId,
    });
  }
}
