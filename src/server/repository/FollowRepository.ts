import { inject, injectable } from "tsyringe";
import type { FollowRepository } from "./interface";
import { type DBClient } from "./util";
import { DI } from "../di.type";

@injectable()
export class FollowRepositoryImpl implements FollowRepository {
  constructor(@inject(DI.PrismaClient) private prisma: DBClient) {}

  async followAvatar(following: {followerId: string, followingId: string}[]) {
    await this.prisma.follow.createMany({
      data: following,
    });
  }

  async unfollowAvatar(following: {followerId: string, followingId: string}[]) {
    await this.prisma.follow.deleteMany({
      where: {
        OR: following.map((f) => ({
          followerId: f.followerId,
          followingId: f.followingId,
        })),
      },
    });
  }

  async getFollowers(avatarId: string) {
    const followers = await this.prisma.follow.findMany({
      where: {
        followingId: avatarId,
      },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    });
    return followers.map(f => f.follower);
  }
  async getFollowing(avatarId: string) {
    const following = await this.prisma.follow.findMany({
      where: {
        followerId: avatarId,
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    });
    return following.map(f => f.following);

  }
  async isFollowing(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findFirst({
      select: {
        id: true,
      },
      where: {
        followerId,
        followingId,
      },
    });
    return !!follow;
  }
}
