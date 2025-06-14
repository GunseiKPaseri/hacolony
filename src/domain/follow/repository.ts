export interface FollowRepository {
  followAvatar(following: { followerId: string; followeeId: string }[]): Promise<void>;
  unfollowAvatar(following: { followerId: string; followeeId: string }[]): Promise<void>;
  getFollowers(avatarId: string): Promise<{ id: string; name: string; imageUrl: string | null }[]>;
  getFollowee(avatarId: string): Promise<{ id: string; name: string; imageUrl: string | null }[]>;
  isFollowing(followerId: string, followeeId: string): Promise<boolean>;
}
