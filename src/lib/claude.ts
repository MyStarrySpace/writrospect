import Anthropic from "@anthropic-ai/sdk";

// Lazy initialization to ensure env vars are loaded
let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

// Model selection
export type ModelChoice = "model_simple" | "model_intermediate" | "model_complex";

function getModelId(choice: ModelChoice): string {
  switch (choice) {
    case "model_simple":
      return "claude-3-haiku-20240307"; // Haiku 3
    case "model_intermediate":
      return "claude-3-5-haiku-latest"; // Haiku 3.5
    case "model_complex":
      return "claude-haiku-4-5-20251101"; // Haiku 4.5
  }
}

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string | Anthropic.ContentBlockParam[];
}

export interface ToolUseResult {
  type: "tool_use";
  toolName: string;
  toolInput: Record<string, unknown>;
  toolUseId: string;
}

export interface TextResult {
  type: "text";
  text: string;
}

export type StreamEvent =
  | { type: "text"; content: string }
  | { type: "tool_use"; toolName: string; toolInput: Record<string, unknown>; toolUseId: string }
  | { type: "done"; stopReason: string; usage?: { input_tokens: number; output_tokens: number } };

export async function* streamChatResponse(
  systemPrompt: string,
  messages: ClaudeMessage[]
): AsyncGenerator<string> {
  const client = getClient();
  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: messages,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}

export async function getChatResponse(
  systemPrompt: string,
  messages: ClaudeMessage[]
): Promise<string> {
  const client = getClient();
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: messages,
  });

  if (response.content[0].type === "text") {
    return response.content[0].text;
  }

  throw new Error("Unexpected response format");
}

// Streaming with tool support
export async function* streamChatWithTools(
  systemPrompt: string,
  messages: Anthropic.MessageParam[],
  tools: Anthropic.Tool[],
  model: ModelChoice = "model_intermediate"
): AsyncGenerator<StreamEvent> {
  const client = getClient();

  const stream = client.messages.stream({
    model: getModelId(model),
    max_tokens: 2048,
    system: systemPrompt,
    messages: messages,
    tools: tools.length > 0 ? tools : undefined,
  });

  let currentToolUse: { id: string; name: string; input: string } | null = null;

  for await (const event of stream) {
    if (event.type === "content_block_start") {
      if (event.content_block.type === "tool_use") {
        currentToolUse = {
          id: event.content_block.id,
          name: event.content_block.name,
          input: "",
        };
      }
    } else if (event.type === "content_block_delta") {
      if (event.delta.type === "text_delta") {
        yield { type: "text", content: event.delta.text };
      } else if (event.delta.type === "input_json_delta" && currentToolUse) {
        currentToolUse.input += event.delta.partial_json;
      }
    } else if (event.type === "content_block_stop") {
      if (currentToolUse) {
        try {
          const toolInput = JSON.parse(currentToolUse.input || "{}");
          yield {
            type: "tool_use",
            toolName: currentToolUse.name,
            toolInput,
            toolUseId: currentToolUse.id,
          };
        } catch (e) {
          console.error("Failed to parse tool input:", e);
        }
        currentToolUse = null;
      }
    } else if (event.type === "message_stop") {
      // Get the final message to check stop reason and usage
      const finalMessage = await stream.finalMessage();
      yield {
        type: "done",
        stopReason: finalMessage.stop_reason || "end_turn",
        usage: finalMessage.usage
          ? { input_tokens: finalMessage.usage.input_tokens, output_tokens: finalMessage.usage.output_tokens }
          : undefined,
      };
    }
  }
}

// Non-streaming version with tool support for tool result handling
export async function chatWithTools(
  systemPrompt: string,
  messages: Anthropic.MessageParam[],
  tools: Anthropic.Tool[]
): Promise<Anthropic.Message> {
  const client = getClient();
  return client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: messages,
    tools: tools,
  });
}
