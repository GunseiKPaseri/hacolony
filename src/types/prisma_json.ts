// Import QueueState at top level (outside namespace)

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    // Queue全体で使用される外部処理待機状態とタスクキュー待ち状態
    type QueueProcessingState = 
      | "QUEUE_WAITING" // タスクキュー待ち状態
      | "EXTERNAL_WAITING" // 外部処理待機状態
      | "PROCESSING" // 処理中
      | "COMPLETED" // 完了
      | "FAILED"; // 失敗

    // BotTask専用のステータス
    type BotTaskStatus =
      | "CREATED" // タスクが作成された
      | "LLM_QUEUED" // LLMタスクキューに投げられた
      | "LLM_PROCESSING" // LLMが処理中
      | "LLM_COMPLETED" // LLM処理が完了
      | "POST_QUEUED" // PostQueueに投稿がスケジュールされた
      | "POST_PROCESSING" // PostQueueで投稿処理中
      | "POST_COMPLETED" // 投稿が完了
      | "FAILED"; // 処理に失敗

    // LLM専用のステータス
    type LLMTaskStatus =
      | "WAITING" // LLMへの送信待ち
      | "PROCESSING" // LLM処理中
      | "RESPONSED" // LLMレスポンス受信完了
      | "FAILED"; // 処理失敗

    // PostQueue専用のステータス
    type PostQueueStatus =
      | "SCHEDULED" // 投稿予定
      | "READY" // 投稿準備完了
      | "POSTING" // 投稿中
      | "POSTED" // 投稿完了
      | "FAILED"; // 投稿失敗

    // BotTaskQueue用のコンテキスト - statusで型を厳密に分離
    type TaskContext =
      | {
          type: "random_post";
          status: "CREATED";
        }
      | {
          type: "random_post";
          status: "LLM_QUEUED";
          llmTaskId: string;
        }
      | {
          type: "random_post";
          status: "LLM_PROCESSING";
          llmTaskId: string;
        }
      | {
          type: "random_post";
          status: "POST_QUEUED";
          llmTaskId: string;
          postQueueId: string;
        }
      | {
          type: "random_post";
          status: "POST_PROCESSING";
          llmTaskId: string;
          postQueueId: string;
        }
      | {
          type: "random_post";
          status: "POST_COMPLETED";
          llmTaskId: string;
          postQueueId: string;
          postId: string;
        }
      | {
          type: "random_post";
          status: "FAILED";
          error: string;
          llmTaskId?: string;
          postQueueId?: string;
        }
      | {
          type: "reply_post";
          replyToPostId: string;
          status: "CREATED";
        }
      | {
          type: "reply_post";
          replyToPostId: string;
          status: "LLM_QUEUED";
          llmTaskId: string;
        }
      | {
          type: "reply_post";
          replyToPostId: string;
          status: "LLM_PROCESSING";
          llmTaskId: string;
        }
      | {
          type: "reply_post";
          replyToPostId: string;
          status: "POST_QUEUED";
          llmTaskId: string;
          postQueueId: string;
        }
      | {
          type: "reply_post";
          replyToPostId: string;
          status: "POST_PROCESSING";
          llmTaskId: string;
          postQueueId: string;
        }
      | {
          type: "reply_post";
          replyToPostId: string;
          status: "POST_COMPLETED";
          llmTaskId: string;
          postQueueId: string;
          postId: string;
        }
      | {
          type: "reply_post";
          replyToPostId: string;
          status: "FAILED";
          error: string;
          llmTaskId?: string;
          postQueueId?: string;
        };

    // LlmTaskQueue用のコンテキスト - statusで型を厳密に分離
    type LLMContext = 
      | {
          status: "WAITING";
          prompt: string;
        }
      | {
          status: "PROCESSING";
          prompt: string;
          startedAt: string; // ISO string when processing started
        }
      | {
          status: "RESPONSED";
          prompt: string;
          response: string;
          completedAt: string; // ISO string when completed
        }
      | {
          status: "FAILED";
          prompt: string;
          error: string;
          failedAt: string; // ISO string when failed
        };

    // PostQueue用のコンテキスト - statusで型を厳密に分離
    type PostQueueContext = 
      | {
          status: "SCHEDULED";
          content: string;
          scheduledAt: string; // ISO string when scheduled
        }
      | {
          status: "READY";
          content: string;
          scheduledAt: string;
          readyAt: string; // ISO string when ready to post
        }
      | {
          status: "POSTING";
          content: string;
          scheduledAt: string;
          startedAt: string; // ISO string when posting started
        }
      | {
          status: "POSTED";
          content: string;
          scheduledAt: string;
          postId: string;
          postedAt: string; // ISO string when posted
        }
      | {
          status: "FAILED";
          content: string;
          scheduledAt: string;
          error: string;
          failedAt: string; // ISO string when failed
        };
  }
}

// The file MUST be a module!
export {};
