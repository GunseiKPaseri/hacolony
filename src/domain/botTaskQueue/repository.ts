import type { BotTaskQueue } from "@/generated/client";

export interface BotTaskQueueRepository {
  enqueueTask(params: { avatarId: string; task: PrismaJson.TaskContext }): Promise<BotTaskQueue>;
  getPendingTasks(limit?: number): Promise<BotTaskQueue[]>;
  getProcessingCount(): Promise<number>;
  updateTaskStatus(id: string, status: string): Promise<void>;
  updateTaskContext(id: string, taskContext: PrismaJson.TaskContext): Promise<void>;
  getTaskById(id: string): Promise<BotTaskQueue | null>;
}
