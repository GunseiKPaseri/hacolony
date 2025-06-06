import "./di"; // Initialize DI container
import { container } from "tsyringe";
import { Scheduler } from "./worker/scheduler";

export async function initializeServer() {
  const scheduler = container.resolve(Scheduler);
  await scheduler.start();
  console.log("Server initialized with scheduler running");
}

// For Next.js API routes
export async function initializeScheduler() {
  await initializeServer();
}
