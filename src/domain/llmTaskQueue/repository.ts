import type { LlmTaskQueue } from "@/generated/client";

export interface LlmTaskQueueRepository {
  enqueueTask(params: {
    avatarId: string;
    prompt: string;
    context?: PrismaJson.LLMContext;
    botTaskQueueId?: string;
  }): Promise<LlmTaskQueue>;
  getPendingTasks(limit?: number): Promise<LlmTaskQueue[]>;
  getProcessingCount(): Promise<number>;
  updateTaskStatus(id: string, status: string): Promise<void>;
  updateTaskContext(id: string, context: PrismaJson.LLMContext): Promise<void>;
}
