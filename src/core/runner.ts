import type { AgentConfig, AgentRun, AgentStep } from "./types.js";

export class AgentRunner {
  private config: AgentConfig;
  private currentRun: AgentRun | null = null;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async run(task: string): Promise<AgentRun> {
    const run: AgentRun = {
      id: crypto.randomUUID(),
      agentConfig: this.config,
      steps: [],
      status: "running",
      startedAt: Date.now(),
    };

    this.currentRun = run;

    try {
      const initialStep: AgentStep = {
        id: crypto.randomUUID(),
        action: "initialize",
        input: { task },
        timestamp: Date.now(),
        status: "completed",
      };
      run.steps.push(initialStep);

      console.log(
        `[${this.config.name}] Started run ${run.id} for task: ${task}`
      );

      run.status = "completed";
      run.completedAt = Date.now();
    } catch (error) {
      run.status = "failed";
      run.completedAt = Date.now();

      const errorStep: AgentStep = {
        id: crypto.randomUUID(),
        action: "error",
        timestamp: Date.now(),
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      };
      run.steps.push(errorStep);
    }

    return run;
  }

  getStatus(): AgentRun["status"] {
    return this.currentRun?.status ?? "idle";
  }

  getSteps(): AgentStep[] {
    return this.currentRun?.steps ?? [];
  }
}
