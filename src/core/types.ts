export interface AgentConfig {
  name: string;
  description: string;
  model: string;
  tools: AgentTool[];
  maxSteps: number;
  systemPrompt?: string;
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface ToolParameter {
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required?: boolean;
  default?: unknown;
}

export interface AgentStep {
  id: string;
  action: string;
  toolId?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  timestamp: number;
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
}

export interface AgentRun {
  id: string;
  agentConfig: AgentConfig;
  steps: AgentStep[];
  status: "idle" | "running" | "completed" | "failed";
  startedAt?: number;
  completedAt?: number;
}
