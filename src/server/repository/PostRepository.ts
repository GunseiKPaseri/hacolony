import { inject, injectable } from "tsyringe";
import type { PostRepository } from "./interface";
import { type DBClient, InvalidInputError, NotFoundError } from "./util";
import { DI } from "../di.type";

@injectable()
export class PostRepositoryImpl implements PostRepository {
  constructor(@inject(DI.PrismaClient) private prisma: DBClient) {}

  async getPostsByUserId(userId: string) {
    const user = await this.prisma.user.findUnique({
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

    const posts = await this.prisma.post.findMany({
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

  private async createPost(props: { content: string; postedByAvatarId: string; replyToId: string | null }) {
    if (!props.content) {
      throw new InvalidInputError("投稿内容を入力してください");
    }

    console.log("createPost", props);

    // 投稿作成時にリプライ先の存在を検証
    if (props.replyToId) {
      const parentPost = await this.prisma.post.findUnique({
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

  async createPostByAvatarId(props: { content: string; postedByAvatarId: string; replyToId: string | null }) {
    const avatar = await this.prisma.avatar.findUnique({
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

  async createPostByUserId(props: { content: string; postedByUserId: string; replyToId: string | null }) {
    const user = await this.prisma.user.findUnique({
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

  async getTimelinePostsByUserId(userId: string) {
    const user = await this.prisma.user.findUnique({
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

    // 自分がフォローしているアバターのIDを取得
    const followees = await this.prisma.follow.findMany({
      where: {
        followerId: user.selfAvatarId,
      },
      select: {
        followeeId: true,
      },
    });

    const followeeIds = followees.map((f) => f.followeeId);
    // 自分のアバターも含める
    const avatarIds = [user.selfAvatarId, ...followeeIds];

    const posts = await this.prisma.post.findMany({
      where: {
        postedById: {
          in: avatarIds,
        },
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

  async getPostById(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
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

    if (!post) {
      throw new NotFoundError("投稿が見つかりません");
    }

    return post;
  }
}
