import "reflect-metadata";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/server/di";
import { AvatarService } from "@/application/services/avatarService";
import { BotConfigRepository } from "@/domain/botConfig/repository";
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

    const botConfigRepository = container.resolve<BotConfigRepository>(DI.BotConfigRepository);
    const botConfig = await botConfigRepository.updateBotConfig(avatarId, prompt);

    return NextResponse.json(botConfig);
  } catch (error) {
    console.error("Error updating bot config:", error);
    return NextResponse.json({ message: "ボット設定の更新中にエラーが発生しました" }, { status: 500 });
  }
}
