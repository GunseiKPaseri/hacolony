export async function register() {
  // This function can be used to register any global instrumentation or middleware
  // For example, you could set up logging, error handling, etc.
  await import("./server/di");
}
