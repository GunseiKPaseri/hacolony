// Import QueueState at top level (outside namespace)

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    type BotTaskStatus =
      | "CREATED" // タスクが作成された
      | "LLM_QUEUED" // LLMタスクキューに投げられた
      | "LLM_PROCESSING" // LLMが処理中
      | "LLM_COMPLETED" // LLM処理が完了
      | "POST_QUEUED" // PostQueueに投稿がスケジュールされた
      | "POST_PROCESSING" // PostQueueで投稿処理中
      | "POST_COMPLETED" // 投稿が完了
      | "FAILED"; // 処理に失敗

    type TaskContext =
      | {
          type: "random_post";
          status?: BotTaskStatus;
          llmTaskId?: string;
          postQueueId?: string;
          postId?: string;
          error?: string;
        }
      | {
          type: "reply_post";
          replyToPostId: string;
          status?: BotTaskStatus;
          llmTaskId?: string;
          postQueueId?: string;
          postId?: string;
          error?: string;
          botTaskQueueId?: string;
        };

    type LLMContext = {
      prompt: string; // The prompt to be sent to the LLM
    } & (
      {
        status: "WAITING";
      } | {
        status: "RESPONSED";
        response: string; // The response from the LLM
        completedAt: string; // ISO string when completed
      } | {
        status: "FAILED";
        error?: string; // Error message if processing failed
        failedAt?: string; // ISO string when failed
      }
    )
  }
}

// The file MUST be a module!
export {};
