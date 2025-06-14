import { inject, injectable } from "tsyringe";
import type { FollowRepository } from "../../domain/follow/repository";
import { type DBClient } from "./util";
import { DI } from "../../server/di.type";

@injectable()
export class FollowRepositoryImpl implements FollowRepository {
  constructor(@inject(DI.PrismaClient) private prisma: DBClient) {}

  async followAvatar(following: { followerId: string; followeeId: string }[]) {
    await this.prisma.follow.createMany({
      data: following,
    });
  }

  async unfollowAvatar(following: { followerId: string; followeeId: string }[]) {
    await this.prisma.follow.deleteMany({
      where: {
        OR: following.map((f) => ({
          followerId: f.followerId,
          followeeId: f.followeeId,
        })),
      },
    });
  }

  async getFollowers(avatarId: string) {
    const followers = await this.prisma.follow.findMany({
      where: {
        followeeId: avatarId,
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
    return followers.map((f) => f.follower);
  }
  async getFollowee(avatarId: string) {
    const followee = await this.prisma.follow.findMany({
      where: {
        followerId: avatarId,
      },
      include: {
        followee: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    });
    return followee.map((f) => f.followee);
  }
  async isFollowing(followerId: string, followeeId: string) {
    const follow = await this.prisma.follow.findFirst({
      select: {
        id: true,
      },
      where: {
        followerId,
        followeeId,
      },
    });
    return !!follow;
  }
}
