import type { AgentConfig, AgentTool } from "./types.js";

export class AgentDesigner {
  private config: AgentConfig;

  constructor(name: string, description: string) {
    this.config = {
      name,
      description,
      model: "default",
      tools: [],
      maxSteps: 10,
    };
  }

  setModel(model: string): this {
    this.config.model = model;
    return this;
  }

  setSystemPrompt(prompt: string): this {
    this.config.systemPrompt = prompt;
    return this;
  }

  setMaxSteps(max: number): this {
    this.config.maxSteps = max;
    return this;
  }

  addTool(tool: AgentTool): this {
    this.config.tools.push(tool);
    return this;
  }

  removeTool(toolId: string): this {
    this.config.tools = this.config.tools.filter((t) => t.id !== toolId);
    return this;
  }

  build(): AgentConfig {
    if (!this.config.name) {
      throw new Error("Agent must have a name");
    }
    if (this.config.tools.length === 0) {
      console.warn(`Agent "${this.config.name}" has no tools configured`);
    }
    return structuredClone(this.config);
  }
}
