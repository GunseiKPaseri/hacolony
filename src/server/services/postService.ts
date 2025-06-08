import { inject, injectable } from "tsyringe";
import type { PostRepository } from "../repository/interface";
import { DI } from "../di.type";
import { InvalidInputError } from "../repository/util";
import { BotReplyService } from "./botReplyService";
import type { Logger } from "pino";

export interface CreatePostInput {
  content: string;
  postedByUserId: string;
  replyToId?: string | null;
}

@injectable()
export class PostService {
  constructor(
    @inject(DI.PostRepository) private readonly postRepository: PostRepository,
    @inject(DI.BotReplyService) private readonly botReplyService: BotReplyService,
    @inject(DI.Logger) private readonly logger: Logger,
  ) {}

  async getPostsByUserId(userId: string) {
    if (!userId || userId.trim().length === 0) {
      throw new InvalidInputError("ユーザーIDが必要です");
    }

    return await this.postRepository.getPostsByUserId(userId);
  }

  async createPost(input: CreatePostInput) {
    const { content, postedByUserId, replyToId } = input;

    // 入力値検証
    if (!content || content.trim().length === 0) {
      throw new InvalidInputError("投稿内容を入力してください");
    }

    if (!postedByUserId || postedByUserId.trim().length === 0) {
      throw new InvalidInputError("投稿者IDが必要です");
    }

    if (content.trim().length > 280) {
      throw new InvalidInputError("投稿は280文字以内で入力してください");
    }

    const post = await this.postRepository.createPostByUserId({
      content: content.trim(),
      postedByUserId,
      replyToId: replyToId || null,
    });

    this.logger.info({ postId: post.id, content: post.content }, "Post created");

    // バックグラウンドでボットのリプライをトリガー（レスポンスを遅延させないため）
    this.triggerBotRepliesInBackground(post.id, post.postedById);

    return post;
  }

  private triggerBotRepliesInBackground(postId: string, authorUserId: string): void {
    // 非同期でボットリプライをトリガー
    this.logger.debug({ postId, authorUserId }, "Triggering bot replies in background");
    this.botReplyService.triggerBotReplies(postId, authorUserId).catch((error) => {
      this.logger.error({ error, postId, authorUserId }, "Background bot reply trigger failed");
    });
  }
}
