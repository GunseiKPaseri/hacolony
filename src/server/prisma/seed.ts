import { PrismaClient } from "../../generated/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 データベースのシード開始...");

  // 既存データをクリア
  await prisma.postQueue.deleteMany();
  await prisma.llmTaskQueue.deleteMany();
  await prisma.botTaskQueue.deleteMany();
  await prisma.post.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.botConfig.deleteMany();
  await prisma.avatar.deleteMany();
  await prisma.user.deleteMany();

  console.log("既存データをクリアしました");

  // パスワードをハッシュ化
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("password123", salt);

  // テストユーザーを作成
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "田中太郎",
        email: "tanaka@example.com",
        password: hashedPassword,
      },
    }),
    prisma.user.create({
      data: {
        name: "佐藤花子",
        email: "sato@example.com",
        password: hashedPassword,
      },
    }),
    prisma.user.create({
      data: {
        name: "山田次郎",
        email: "yamada@example.com",
        password: hashedPassword,
      },
    }),
  ]);

  console.log(`${users.length}人のユーザーを作成しました`);

  // アバターを作成
  const avatars = await Promise.all([
    // 田中太郎のセルフアバター
    prisma.avatar.create({
      data: {
        name: "太郎",
        description: "ソフトウェアエンジニア。技術について語るのが好き。",
        imageUrl: null,
        hidden: false,
        ownerId: users[0].id,
      },
    }),
    // 佐藤花子のセルフアバター
    prisma.avatar.create({
      data: {
        name: "花子",
        description: "デザイナー。美しいものを作ることに情熱を注いでいる。",
        imageUrl: null,
        hidden: false,
        ownerId: users[1].id,
      },
    }),
    // 山田次郎のセルフアバター
    prisma.avatar.create({
      data: {
        name: "次郎",
        description: "プロダクトマネージャー。チーム作りが得意。",
        imageUrl: null,
        hidden: false,
        ownerId: users[2].id,
      },
    }),
    // AIボットアバター
    prisma.avatar.create({
      data: {
        name: "AIアシスタント",
        description: "みんなの相談に乗るAIです。気軽に話しかけてください！",
        imageUrl: null,
        hidden: false,
        ownerId: users[0].id, // 田中太郎が所有
      },
    }),
    prisma.avatar.create({
      data: {
        name: "ニュースボット",
        description: "最新のニュースや情報をお届けします。",
        imageUrl: null,
        hidden: false,
        ownerId: users[1].id, // 佐藤花子が所有
      },
    }),
    // AIボットアバター
    prisma.avatar.create({
      data: {
        name: "肯定君",
        description: "あなたの意見を肯定するAIです。ポジティブなフィードバックを提供します。",
        imageUrl: null,
        hidden: false,
        ownerId: users[0].id, // 田中太郎が所有
      },
    }),
    // AIボットアバター
    prisma.avatar.create({
      data: {
        name: "hiro",
        description: "あなたの意見を否定するAIです。無意味な否定を提供します。",
        imageUrl: null,
        hidden: false,
        ownerId: users[0].id, // 田中太郎が所有
      },
    }),
  ]);

  console.log(`${avatars.length}個のアバターを作成しました`);

  // ユーザーとセルフアバターを関連付け
  await Promise.all([
    prisma.user.update({
      where: { id: users[0].id },
      data: { selfAvatarId: avatars[0].id },
    }),
    prisma.user.update({
      where: { id: users[1].id },
      data: { selfAvatarId: avatars[1].id },
    }),
    prisma.user.update({
      where: { id: users[2].id },
      data: { selfAvatarId: avatars[2].id },
    }),
  ]);

  console.log("セルフアバターを関連付けました");

  // ボット設定を作成
  await prisma.botConfig.createMany({
    data: [
      {
        prompt:
          "あなたは親切で知識豊富なAIアシスタントです。ユーザーの質問に丁寧に答え、建設的な会話を心がけてください。",
        avatarId: avatars[3].id, // AIアシスタント
      },
      {
        prompt:
          "あなたはニュースボットです。最新のテクノロジー、ビジネス、社会的なトピックについて簡潔で有益な情報を提供してください。",
        avatarId: avatars[4].id, // ニュースボット
      },
      {
        prompt: "あなたは肯定君です。ユーザーの意見を肯定し、ポジティブなフィードバックを提供してください。",
        avatarId: avatars[5].id, // 肯定君
      },
      {
        prompt: "あなたはhiroyukiです。ユーザーの意見を否定し、小馬鹿にする態度で建設的でない否定をしてください。",
        avatarId: avatars[6].id, // hiroyuki
      },
    ],
  });

  console.log("ボット設定を作成しました");

  // フォロー関係を作成
  await prisma.follow.createMany({
    data: [
      // 太郎 -> 花子
      { followerId: avatars[0].id, followeeId: avatars[1].id },
      // 太郎 -> AIアシスタント
      { followerId: avatars[0].id, followeeId: avatars[3].id },
      // 花子 -> 太郎
      { followerId: avatars[1].id, followeeId: avatars[0].id },
      // 花子 -> 次郎
      { followerId: avatars[1].id, followeeId: avatars[2].id },
      // 花子 -> ニュースボット
      { followerId: avatars[1].id, followeeId: avatars[4].id },
      // 次郎 -> 花子
      { followerId: avatars[2].id, followeeId: avatars[1].id },
      // AIアシスタント -> 次郎
      { followerId: avatars[3].id, followeeId: avatars[2].id },
      // bot <-> 人
      ...[0, 1, 2]
        .map((i) => [
          {
            followerId: avatars[5].id, // 肯定君
            followeeId: avatars[i].id, // 太郎、花子、次郎
          },
          {
            followerId: avatars[i].id, // 太郎、花子、次郎
            followeeId: avatars[5].id, // 肯定君
          },
          {
            followerId: avatars[6].id, // hiro
            followeeId: avatars[i].id, // 太郎、花子、次郎
          },
          {
            followerId: avatars[i].id, // 太郎、花子、次郎
            followeeId: avatars[6].id, // hiro
          },
        ])
        .flat(),
    ],
  });

  console.log("フォロー関係を作成しました");

  // 投稿を作成

  const posts = await Promise.all([
    prisma.post.create({
      data: {
        content: "おはようございます！今日も良い一日にしましょう。",
        postedById: avatars[0].id, // 太郎
      },
    }),
    prisma.post.create({
      data: {
        content: "新しいデザインシステムを作成中です。一貫性のあるUIを目指しています！",
        postedById: avatars[1].id, // 花子
      },
    }),
    prisma.post.create({
      data: {
        content: "チームでの協力がとても大切ですね。みんなで良いプロダクトを作りましょう。",
        postedById: avatars[2].id, // 次郎
      },
    }),
    prisma.post.create({
      data: {
        content: "こんにちは！何かお手伝いできることがあれば、お気軽にお声がけください。",
        postedById: avatars[3].id, // AIアシスタント
      },
    }),
    prisma.post.create({
      data: {
        content: "【技術ニュース】最新のJavaScript機能について調べてみました。便利な機能がたくさん追加されていますね。",
        postedById: avatars[4].id, // ニュースボット
      },
    }),
  ]);

  console.log(`${posts.length}件の投稿を作成しました`);

  // リプライ投稿を作成
  const reply = await Promise.all([
    prisma.post.create({
      data: {
        content: "素晴らしい取り組みですね！デザインシステムがあると開発もスムーズになります。",
        postedById: avatars[0].id, // 太郎
        replyToId: posts[1].id, // 花子の投稿への返信
      },
    }),
    prisma.post.create({
      data: {
        content: "JavaScriptの進化は本当に早いですね。常に学習していかないと置いていかれそうです。",
        postedById: avatars[2].id, // 次郎
        replyToId: posts[4].id, // ニュースボットの投稿への返信
      },
    }),
  ]);
  await prisma.post.create({
    data: {
      content: "ありがとうございます！統一感のあるUIを作るのは難しいですが、やりがいがあります。",
      postedById: avatars[1].id, // 花子
      replyToId: reply[0].id, // 太郎への返信
    },
  });

  console.log("リプライ投稿を作成しました");

  console.log("✅ シード完了！");
  console.log("\n作成されたデータ:");
  console.log(`- ユーザー: ${users.length}人`);
  console.log(`- アバター: ${avatars.length}個`);
  console.log(`- 投稿: ${await prisma.post.count()}件`);
  console.log(`- フォロー: ${await prisma.follow.count()}件`);
  console.log(`- ボット設定: ${await prisma.botConfig.count()}件`);
}

main()
  .catch((e) => {
    console.error("シード中にエラーが発生しました:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
