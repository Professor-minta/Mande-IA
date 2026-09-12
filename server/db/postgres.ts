import pg from 'pg';
const { Pool } = pg;

export interface AgentRunRecord {
  id?: string;
  conversationId?: string;
  userQuery: string;
  intent: string;
  confidenceScore: number;
  selectedModel: string;
  status: 'started' | 'running' | 'completed' | 'failed';
  latencyMs: number;
}

export interface ToolCallRecord {
  id?: string;
  agentRunId: string;
  toolName: string;
  toolInput: any;
  toolOutput: any;
  executionTimeMs: number;
}

export interface MessageRecord {
  id?: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  language: string;
}

class DatabaseService {
  private pool: pg.Pool | null = null;
  private isConnected = false;
  private memoryRuns: AgentRunRecord[] = [];
  private memoryToolCalls: ToolCallRecord[] = [];
  private memoryMessages: MessageRecord[] = [];

  constructor() {
    this.init();
  }

  private async init() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.log('ℹ️ DATABASE_URL not set: using PostgreSQL structured in-memory adapter.');
      return;
    }

    try {
      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
        max: 10,
        idleTimeoutMillis: 30000,
      });

      // Quick test query
      const client = await this.pool.connect();
      client.release();
      this.isConnected = true;
      console.log('✅ Connected to PostgreSQL database successfully.');
      await this.runMigrations();
    } catch (err: any) {
      console.warn('⚠️ PostgreSQL connection failed, switching to structured in-memory storage:', err?.message);
      this.isConnected = false;
      this.pool = null;
    }
  }

  private async runMigrations() {
    if (!this.pool) return;
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE,
            preferred_language VARCHAR(10) DEFAULT 'bm',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS conversations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255) NOT NULL DEFAULT 'Session Mandé',
            language VARCHAR(10) DEFAULT 'bm',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            conversation_id UUID,
            role VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            language VARCHAR(10) DEFAULT 'bm',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS agent_runs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            conversation_id UUID,
            user_query TEXT NOT NULL,
            intent VARCHAR(50) NOT NULL,
            confidence_score NUMERIC(5, 2),
            selected_model VARCHAR(100) NOT NULL,
            status VARCHAR(30) DEFAULT 'completed',
            latency_ms INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS tool_calls (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            agent_run_id UUID,
            tool_name VARCHAR(100) NOT NULL,
            tool_input JSONB,
            tool_output JSONB,
            execution_time_ms INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ PostgreSQL schema migrations applied successfully.');
    } catch (e: any) {
      console.warn('⚠️ Migration warning:', e?.message);
    }
  }

  public async logAgentRun(run: AgentRunRecord): Promise<string> {
    const runId = run.id || `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const record = { ...run, id: runId };

    if (this.pool && this.isConnected) {
      try {
        await this.pool.query(
          `INSERT INTO agent_runs (id, conversation_id, user_query, intent, confidence_score, selected_model, status, latency_ms)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [record.id, record.conversationId || null, record.userQuery, record.intent, record.confidenceScore, record.selectedModel, record.status, record.latencyMs]
        );
        return runId;
      } catch (err) {
        console.warn('PostgreSQL write failed, storing in memory:', err);
      }
    }

    this.memoryRuns.push(record);
    if (this.memoryRuns.length > 500) this.memoryRuns.shift();
    return runId;
  }

  public async logToolCall(toolCall: ToolCallRecord): Promise<string> {
    const id = toolCall.id || `tool_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const record = { ...toolCall, id };

    if (this.pool && this.isConnected) {
      try {
        await this.pool.query(
          `INSERT INTO tool_calls (id, agent_run_id, tool_name, tool_input, tool_output, execution_time_ms)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [record.id, record.agentRunId, record.toolName, JSON.stringify(record.toolInput), JSON.stringify(record.toolOutput), record.executionTimeMs]
        );
        return id;
      } catch (err) {
        console.warn('PostgreSQL tool_calls write failed, storing in memory:', err);
      }
    }

    this.memoryToolCalls.push(record);
    if (this.memoryToolCalls.length > 500) this.memoryToolCalls.shift();
    return id;
  }

  public async saveMessage(msg: MessageRecord): Promise<string> {
    const id = msg.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const record = { ...msg, id };

    if (this.pool && this.isConnected) {
      try {
        await this.pool.query(
          `INSERT INTO messages (id, conversation_id, role, content, language)
           VALUES ($1, $2, $3, $4, $5)`,
          [record.id, record.conversationId, record.role, record.content, record.language]
        );
        return id;
      } catch (err) {
        console.warn('PostgreSQL message write failed:', err);
      }
    }

    this.memoryMessages.push(record);
    return id;
  }

  public async getStats() {
    if (this.pool && this.isConnected) {
      try {
        const runsCount = await this.pool.query('SELECT COUNT(*) as count FROM agent_runs');
        const toolsCount = await this.pool.query('SELECT COUNT(*) as count FROM tool_calls');
        return {
          storageType: 'PostgreSQL (Active)',
          totalAgentRuns: parseInt(runsCount.rows[0].count, 10),
          totalToolCalls: parseInt(toolsCount.rows[0].count, 10),
          status: 'healthy'
        };
      } catch (e) {
        // fallback
      }
    }

    return {
      storageType: 'PostgreSQL Relational Adapter (In-Memory Fallback)',
      totalAgentRuns: this.memoryRuns.length,
      totalToolCalls: this.memoryToolCalls.length,
      status: 'ready'
    };
  }
}

export const db = new DatabaseService();
