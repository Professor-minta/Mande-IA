import { agentPlanner, PlanResult } from './planner.js';
import { toolRouter } from './toolRouter.js';
import { modelRouter } from './modelRouter.js';
import { db } from '../db/postgres.js';
import { ExaSearchResult } from '../providers/exa.js';

export interface AgentPipelineRequest {
  message: string;
  language?: string;
  model?: string;
  enableWebSearch?: boolean;
  history?: Array<{ role: string; content: string }>;
  conversationId?: string;
}

export interface AgentPipelineResponse {
  reply: string;
  intent: string;
  intentLabel: string;
  language: string;
  latencyMs: number;
  sources: ExaSearchResult[];
  toolsExecuted: string[];
  plannerSteps: string[];
  modelUsed: string;
  provider: string;
  agentRunId: string;
  timestamp: string;
}

export class AgentCore {
  public async execute(req: AgentPipelineRequest): Promise<AgentPipelineResponse> {
    const start = Date.now();
    const {
      message,
      language: reqLang,
      model = 'anthropic/claude-3.5-sonnet',
      enableWebSearch = true,
      history = [],
      conversationId = `conv_${Date.now()}`
    } = req;

    const query = message.trim();

    // 1. Planner Phase
    const plan: PlanResult = agentPlanner.plan(query, reqLang, enableWebSearch);
    const agentRunId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // 2. Tool Execution Phase
    const toolsExecuted: string[] = [];
    let sources: ExaSearchResult[] = [];

    if (plan.requiresLiveWeb) {
      toolsExecuted.push('exa_web_search');
      const toolRes = await toolRouter.executeTool(
        agentRunId,
        'exa_web_search',
        plan.searchQuery || query
      );
      if (toolRes.success && Array.isArray(toolRes.data)) {
        sources = toolRes.data;
      }
    }

    // 3. Model Generation Phase
    const genRes = await modelRouter.routeAndGenerate({
      query,
      plan,
      selectedModel: model,
      sources,
      history,
    });

    const latencyMs = Math.max(16, Date.now() - start);

    // 4. Structured Database Persistence (PostgreSQL)
    await db.logAgentRun({
      id: agentRunId,
      conversationId,
      userQuery: query,
      intent: plan.intent,
      confidenceScore: plan.confidence,
      selectedModel: genRes.modelUsed,
      status: 'completed',
      latencyMs,
    });

    await db.saveMessage({
      conversationId,
      role: 'user',
      content: query,
      language: plan.language,
    });

    await db.saveMessage({
      conversationId,
      role: 'assistant',
      content: genRes.reply,
      language: plan.language,
    });

    return {
      reply: genRes.reply,
      intent: plan.intent,
      intentLabel: plan.intentLabel,
      language: plan.language,
      latencyMs,
      sources,
      toolsExecuted,
      plannerSteps: plan.steps,
      modelUsed: genRes.modelUsed,
      provider: genRes.provider,
      agentRunId,
      timestamp: new Date().toISOString(),
    };
  }
}

export const agentCore = new AgentCore();
