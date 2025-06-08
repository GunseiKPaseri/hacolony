import { inject, injectable } from "tsyringe";
import { BotTaskWorker } from "./botTaskWorker";
import { LlmTaskWorker } from "./llmTaskWorker";
import { PostQueueWorker } from "./postQueueWorker";
import { DI } from "../di.type";
import type { Logger } from "pino";

@injectable()
export class Scheduler {
  constructor(
    @inject(DI.BotTaskWorker) private readonly botTaskWorker: BotTaskWorker,
    @inject(DI.LlmTaskWorker) private readonly llmTaskWorker: LlmTaskWorker,
    @inject(DI.PostQueueWorker) private readonly postQueueWorker: PostQueueWorker,
    @inject(DI.Logger) private readonly logger: Logger,
  ) {}

  async start(): Promise<void> {
    this.logger.info("Starting scheduler...");

    // Process bot tasks every 3 minutes
    setInterval(async () => {
      this.logger.debug("bot task working");
      await this.botTaskWorker.processTasks();
    }, 5 * 1000);

    // Process LLM tasks every 2 minutes
    setInterval(
      async () => {
        this.logger.debug("llm task working");
        await this.llmTaskWorker.processTasks();
      },
      2 * 60 * 1000,
    );

    // Process due posts every minute
    setInterval(async () => {
      this.logger.debug("post queue working");
      await this.postQueueWorker.processDuePosts();
    }, 5 * 1000);

    // Initial run
    await this.botTaskWorker.processTasks();
    await this.llmTaskWorker.processTasks();
    await this.postQueueWorker.processDuePosts();
  }
}
