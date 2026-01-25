// src/lib/opik/tracers.ts

import { opikClient } from './client';
import { OpikTraceData } from '../types';

/**
 * Create a new trace for tracking agent operations
 */
export function createTrace(
  name: string,
  input: any,
  metadata?: Record<string, any>
) {
  return opikClient.trace({
    name,
    input: { data: input },
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Create a span within an existing trace
 */
export function createSpan(
  trace: any,
  name: string,
  type: 'llm' | 'tool' | 'general',
  input?: any
) {
  return trace.span({
    name,
    type,
    input: input ? { data: input } : undefined,
  });
}

/**
 * Log a successful operation
 */
export function logSuccess(
  traceOrSpan: any,
  output: any,
  duration: number,
  metadata?: Record<string, any>
) {
  traceOrSpan.update({
    output: { data: output },
    metadata: {
      ...metadata,
      duration,
      status: 'success',
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log a failed operation
 */
export function logError(
  traceOrSpan: any,
  error: Error | unknown,
  duration: number,
  metadata?: Record<string, any>
) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorType = error instanceof Error ? error.constructor.name : 'Unknown';

  traceOrSpan.update({
    output: { error: errorMessage },
    metadata: {
      ...metadata,
      duration,
      status: 'error',
      errorType,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Trace a complete async operation
 */
export async function traceOperation<T>(
  name: string,
  input: any,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<{ result: T; traceData: OpikTraceData }> {
  const trace = createTrace(name, input, metadata);
  const startTime = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    logSuccess(trace, result, duration, metadata);
    trace.end();
    await opikClient.flush();

    return {
      result,
      traceData: {
        traceId: trace.id || '',
        spanId: '',
        agentName: name,
        input,
        output: result,
        metadata: { ...metadata, duration, status: 'success' },
        duration,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    logError(trace, error, duration, metadata);
    trace.end();
    await opikClient.flush();

    throw error;
  }
}

/**
 * Trace multiple operations in sequence
 */
export async function traceSequence<T>(
  traceName: string,
  operations: Array<{
    name: string;
    fn: () => Promise<any>;
    metadata?: Record<string, any>;
  }>
): Promise<T[]> {
  const trace = createTrace(traceName, { operations: operations.length });
  const results: T[] = [];

  for (const op of operations) {
    const span = createSpan(trace, op.name, 'general', op.metadata);
    const startTime = Date.now();

    try {
      const result = await op.fn();
      const duration = Date.now() - startTime;

      logSuccess(span, result, duration, op.metadata);
      span.end();
      results.push(result);
    } catch (error) {
      const duration = Date.now() - startTime;

      logError(span, error, duration, op.metadata);
      span.end();
      throw error;
    }
  }

  trace.end();
  await opikClient.flush();

  return results;
}

/**
 * Trace parallel operations
 */
export async function traceParallel<T>(
  traceName: string,
  operations: Array<{
    name: string;
    fn: () => Promise<any>;
    metadata?: Record<string, any>;
  }>
): Promise<T[]> {
  const trace = createTrace(traceName, { operations: operations.length });

  const promises = operations.map(async (op) => {
    const span = createSpan(trace, op.name, 'general', op.metadata);
    const startTime = Date.now();

    try {
      const result = await op.fn();
      const duration = Date.now() - startTime;

      logSuccess(span, result, duration, op.metadata);
      span.end();
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logError(span, error, duration, op.metadata);
      span.end();
      throw error;
    }
  });

  const results = await Promise.all(promises);
  trace.end();
  await opikClient.flush();

  return results;
}

/**
 * Create a custom trace with manual control
 */
export class CustomTrace {
  private trace: any;
  private startTime: number;

  constructor(name: string, input: any, metadata?: Record<string, any>) {
    this.trace = createTrace(name, input, metadata);
    this.startTime = Date.now();
  }

  createSpan(name: string, type: 'llm' | 'tool' | 'general', input?: any) {
    return createSpan(this.trace, name, type, input);
  }

  logSuccess(output: any, metadata?: Record<string, any>) {
    const duration = Date.now() - this.startTime;
    logSuccess(this.trace, output, duration, metadata);
  }

  logError(error: Error | unknown, metadata?: Record<string, any>) {
    const duration = Date.now() - this.startTime;
    logError(this.trace, error, duration, metadata);
  }

  async end() {
    this.trace.end();
    await opikClient.flush();
  }

  getId(): string {
    return this.trace.id || '';
  }
}

export default {
  createTrace,
  createSpan,
  logSuccess,
  logError,
  traceOperation,
  traceSequence,
  traceParallel,
  CustomTrace,
};