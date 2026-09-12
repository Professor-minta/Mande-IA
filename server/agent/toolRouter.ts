import { exaProvider, ExaSearchResult } from '../providers/exa.js';
import { db } from '../db/postgres.js';

export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  data: any;
  executionTimeMs: number;
}

export class ToolRouter {
  public async executeTool(
    agentRunId: string,
    toolName: string,
    input: any
  ): Promise<ToolExecutionResult> {
    const start = Date.now();
    let data: any = null;
    let success = false;

    try {
      if (toolName === 'exa_web_search') {
        const query = typeof input === 'string' ? input : input?.query || '';
        const results: ExaSearchResult[] = await exaProvider.search({ query });
        data = results;
        success = true;
      } else {
        throw new Error(`Outil inconnu : ${toolName}`);
      }
    } catch (err: any) {
      console.warn(`Tool execution error [${toolName}]:`, err?.message);
      data = { error: err?.message };
      success = false;
    }

    const executionTimeMs = Date.now() - start;

    // Log tool execution into PostgreSQL data layer
    await db.logToolCall({
      agentRunId,
      toolName,
      toolInput: input,
      toolOutput: data,
      executionTimeMs,
    });

    return {
      toolName,
      success,
      data,
      executionTimeMs,
    };
  }
}

export const toolRouter = new ToolRouter();
