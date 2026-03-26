import { z } from "zod";

import type { McpTool } from "@/lib/mcp/types";
import { emailReadTool } from "@/lib/tools/emailRead";
import { emailReplyTool } from "@/lib/tools/emailReply";
import { emailSendTool } from "@/lib/tools/emailSend";
import { emailSummarizeTool } from "@/lib/tools/emailSummarize";

const tools = [emailSendTool, emailReadTool, emailSummarizeTool, emailReplyTool];

export function getToolRegistry(): Map<string, McpTool> {
  return new Map(tools.map((tool) => [tool.name, tool]));
}

export function getToolManifest() {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: z.toJSONSchema(tool.inputSchema),
  }));
}