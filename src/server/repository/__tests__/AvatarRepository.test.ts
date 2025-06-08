import { describe, it, expect, beforeEach } from "vitest";
import { AvatarRepositoryImpl } from "../AvatarRepository";
import { FollowRepositoryImpl } from "../FollowRepository";
import { prisma } from "../../prisma/prisma";
import { DBClient } from "../util";

describe("AvatarRepository.getAvatarById - Followers/Following Test", () => {
  let avatarRepository: AvatarRepositoryImpl;
  let followRepository: FollowRepositoryImpl;
  let dbClient: DBClient;

  beforeEach(async () => {
    dbClient = prisma;
    avatarRepository = new AvatarRepositoryImpl(dbClient);
    followRepository = new FollowRepositoryImpl(dbClient);

    // Clean up existing data (外部キー制約に配慮した削除順序)
    await dbClient.postQueue.deleteMany();
    await dbClient.llmTaskQueue.deleteMany();
    await dbClient.botTaskQueue.deleteMany();
    await dbClient.follow.deleteMany();
    await dbClient.botConfig.deleteMany();
    await dbClient.post.deleteMany();
    await dbClient.avatar.deleteMany();
    await dbClient.user.deleteMany();
  });

  it("should correctly return followers and following relationships", async () => {
    // Setup test data
    const user1 = await dbClient.user.create({
      data: { name: "User1", email: "user1@test.com", password: "pass" }
    });
    const user2 = await dbClient.user.create({
      data: { name: "User2", email: "user2@test.com", password: "pass" }
    });
    const user3 = await dbClient.user.create({
      data: { name: "User3", email: "user3@test.com", password: "pass" }
    });

    // Create avatars
    const avatarA = await avatarRepository.createAvatar({
      name: "AvatarA",
      userId: user1.id,
      description: "Avatar A",
      hidden: false,
    });

    const avatarB = await avatarRepository.createAvatar({
      name: "AvatarB", 
      userId: user2.id,
      description: "Avatar B",
      hidden: false,
    });

    const avatarC = await avatarRepository.createAvatar({
      name: "AvatarC",
      userId: user3.id, 
      description: "Avatar C",
      hidden: false,
    });

    // Create follow relationships
    // AvatarB follows AvatarA
    // AvatarC follows AvatarA
    // AvatarA follows AvatarB
    await followRepository.followAvatar([
      { followerId: avatarB.id, followingId: avatarA.id }, // B → A
      { followerId: avatarC.id, followingId: avatarA.id }, // C → A
      { followerId: avatarA.id, followingId: avatarB.id }, // A → B
    ]);

    // Test AvatarA's relationships
    const avatarADetails = await avatarRepository.getAvatarById(avatarA.id);
    
    expect(avatarADetails).not.toBeNull();
    if (avatarADetails) {
      
      // AvatarA should have 2 followers: AvatarB and AvatarC
      expect(avatarADetails.followers).toHaveLength(2);
      expect(avatarADetails.followers.map(f => f.name).sort()).toEqual(["AvatarB", "AvatarC"]);
      
      // AvatarA should be following 1 avatar: AvatarB  
      expect(avatarADetails.following).toHaveLength(1);
      expect(avatarADetails.following[0].name).toBe("AvatarB");
    }

    // Test AvatarB's relationships
    const avatarBDetails = await avatarRepository.getAvatarById(avatarB.id);
    
    expect(avatarBDetails).not.toBeNull();
    if (avatarBDetails) {
      // AvatarB should have 1 follower: AvatarA
      expect(avatarBDetails.followers).toHaveLength(1);
      expect(avatarBDetails.followers[0].name).toBe("AvatarA");
      
      // AvatarB should be following 1 avatar: AvatarA
      expect(avatarBDetails.following).toHaveLength(1);
      expect(avatarBDetails.following[0].name).toBe("AvatarA");
    }
  });
});