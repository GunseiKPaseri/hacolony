import { injectable } from "tsyringe";

@injectable()
export class OllamaClient {
  private readonly baseUrl = process.env.OLLAMA_API_URL || "http://localhost:11434";

  async generatePost(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma3:latest",
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  }
}
