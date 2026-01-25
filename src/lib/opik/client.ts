// src/lib/opik/client.ts

import { Opik } from 'opik';

// Initialize Opik client
export const opikClient = new Opik({
  apiKey: process.env.OPIK_API_KEY,
  apiUrl: process.env.OPIK_URL_OVERRIDE || 'https://www.comet.com/opik/api',
  projectName: process.env.OPIK_PROJECT_NAME || 'nutrilens-ai',
  workspaceName: process.env.OPIK_WORKSPACE_NAME,
});

// Trace wrapper for agent functions
export async function traceAgent<T>(
  name: string,
  input: any,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<{ result: T; traceId: string }> {
  const trace = opikClient.trace({
    name,
    input: { data: input },
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
      agent: name,
    },
  });

  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    trace.update({
      output: { data: result },
      metadata: {
        ...metadata,
        duration,
        status: 'success',
      },
    });

    trace.end();
    await opikClient.flush();

    return {
      result,
      traceId: trace.id || '',
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    trace.update({
      output: { error: error instanceof Error ? error.message : 'Unknown error' },
      metadata: {
        ...metadata,
        duration,
        status: 'error',
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      },
    });

    trace.end();
    await opikClient.flush();

    throw error;
  }
}

// Span wrapper for sub-operations within agents
export async function traceSpan<T>(
  trace: any,
  name: string,
  type: 'llm' | 'tool' | 'general',
  input: any,
  fn: () => Promise<T>
): Promise<T> {
  const span = trace.span({
    name,
    type,
    input: { data: input },
  });

  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    span.update({
      output: { data: result },
      metadata: { duration, status: 'success' },
    });

    span.end();

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    span.update({
      output: { error: error instanceof Error ? error.message : 'Unknown error' },
      metadata: {
        duration,
        status: 'error',
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      },
    });

    span.end();

    throw error;
  }
}

// Log user feedback to Opik
export async function logFeedback(
  traceId: string,
  feedbackData: {
    score?: number;
    corrections?: Record<string, any>;
    comments?: string;
  }
) {
  try {
    // Create a feedback trace
    const feedbackTrace = opikClient.trace({
      name: 'user-feedback',
      input: { traceId, ...feedbackData },
      metadata: {
        type: 'feedback',
        timestamp: new Date().toISOString(),
        originalTraceId: traceId,
      },
    });

    feedbackTrace.end();
    await opikClient.flush();
  } catch (error) {
    console.error('Error logging feedback to Opik:', error);
  }
}

// Batch logging for multiple traces
export async function batchTrace(
  operations: Array<{
    name: string;
    input: any;
    output: any;
    metadata?: Record<string, any>;
  }>
) {
  for (const op of operations) {
    const trace = opikClient.trace({
      name: op.name,
      input: op.input,
      output: op.output,
      metadata: {
        ...op.metadata,
        timestamp: new Date().toISOString(),
      },
    });

    trace.end();
  }

  await opikClient.flush();
}

export default opikClient;