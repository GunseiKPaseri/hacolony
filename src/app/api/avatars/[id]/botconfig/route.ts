import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { container } from "@/server/di";
import { AvatarService } from "@/server/services/avatarService";
import { BotConfigRepository } from "@/server/repository/interface";
import { DI } from "@/server/di.type";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    const { id: avatarId } = await params;
    const avatarService = container.resolve<AvatarService>(DI.AvatarService);
    const avatar = await avatarService.getAvatarById(avatarId);

    if (!avatar || avatar.ownerId !== session.user.id) {
      return NextResponse.json({ message: "アクセス権限がありません" }, { status: 403 });
    }

    const botConfigRepository = container.resolve<BotConfigRepository>(DI.BotConfigRepository);
    const botConfig = await botConfigRepository.getBotConfigByAvatarId(avatarId);

    return NextResponse.json(botConfig);
  } catch (error) {
    console.error("Error fetching bot config:", error);
    return NextResponse.json({ message: "ボット設定の取得中にエラーが発生しました" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ message: "プロンプトが必要です" }, { status: 400 });
    }

    const { id: avatarId } = await params;
    const avatarService = container.resolve<AvatarService>(DI.AvatarService);
    const avatar = await avatarService.getAvatarById(avatarId);

    if (!avatar || avatar.ownerId !== session.user.id) {
      return NextResponse.json({ message: "アクセス権限がありません" }, { status: 403 });
    }

    const botConfigRepository = container.resolve<BotConfigRepository>(DI.BotConfigRepository);
    const botConfig = await botConfigRepository.createBotConfig({
      avatarId,
      prompt,
    });

    return NextResponse.json(botConfig, { status: 201 });
  } catch (error) {
    console.error("Error creating bot config:", error);
    return NextResponse.json({ message: "ボット設定の作成中にエラーが発生しました" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ message: "プロンプトが必要です" }, { status: 400 });
    }

    const { id: avatarId } = await params;
    const avatarService = container.resolve<AvatarService>(DI.AvatarService);
    const avatar = await avatarService.getAvatarById(avatarId);

    if (!avatar || avatar.ownerId !== session.user.id) {
      return NextResponse.json({ message: "アクセス権限がありません" }, { status: 403 });
    }

    // 既存のBotConfigを更新（実装が必要）
    // 現在は新規作成のみサポート
    return NextResponse.json({ message: "BotConfig更新は未実装です" }, { status: 501 });
  } catch (error) {
    console.error("Error updating bot config:", error);
    return NextResponse.json({ message: "ボット設定の更新中にエラーが発生しました" }, { status: 500 });
  }
}
