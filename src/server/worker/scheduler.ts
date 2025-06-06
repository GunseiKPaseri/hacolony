import { inject, injectable } from "tsyringe";
import { BotTaskWorker } from "./botTaskWorker";
import { LlmTaskWorker } from "./llmTaskWorker";
import { PostQueueWorker } from "./postQueueWorker";
import { DI } from "../di.type";

@injectable()
export class Scheduler {
  constructor(
    @inject(DI.BotTaskWorker) private readonly botTaskWorker: BotTaskWorker,
    @inject(DI.LlmTaskWorker) private readonly llmTaskWorker: LlmTaskWorker,
    @inject(DI.PostQueueWorker) private readonly postQueueWorker: PostQueueWorker
  ) {}

  async start(): Promise<void> {
    console.log("Starting scheduler...");
    
    // Process bot tasks every 3 minutes
    setInterval(async () => {
      console.log("bot task working")
      await this.botTaskWorker.processTasks();
    }, 5 * 1000);

    // Process LLM tasks every 2 minutes
    setInterval(async () => {
      console.log("llm task working")
      await this.llmTaskWorker.processTasks();
    }, 2 * 60 * 1000);

    // Process due posts every minute
    setInterval(async () => {
      console.log("post queue working")
      await this.postQueueWorker.processDuePosts();
    }, 5 * 1000);

    // Initial run
    await this.botTaskWorker.processTasks();
    await this.llmTaskWorker.processTasks();
    await this.postQueueWorker.processDuePosts();
  }
}
