// src/lib/opik/tracers.ts

import { opikClient } from './client';
import { OpikTraceData } from '../types';

// Define types for Opik trace and span objects
type OpikTrace = ReturnType<typeof opikClient.trace>;
type OpikSpan = ReturnType<OpikTrace['span']>;

/**
 * Create a new trace for tracking agent operations
 */
export function createTrace(
  name: string,
  input: Record<string, unknown>,
  metadata?: Record<string, unknown>
): OpikTrace {
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
  trace: OpikTrace,
  name: string,
  type: 'llm' | 'tool' | 'general',
  input?: Record<string, unknown>
): OpikSpan {
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
  traceOrSpan: OpikTrace | OpikSpan,
  output: unknown,
  duration: number,
  metadata?: Record<string, unknown>
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
  traceOrSpan: OpikTrace | OpikSpan,
  error: Error | unknown,
  duration: number,
  metadata?: Record<string, unknown>
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
 * Trace a complete async operation with proper span creation
 */
export async function traceOperation<T>(
  name: string,
  input: Record<string, unknown>,
  operation: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<{ result: T; traceData: OpikTraceData }> {
  const trace = createTrace(name, input, metadata);
  // Always create a child span for the operation
  const span = createSpan(trace, `${name}-execution`, 'general', input);
  const startTime = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    logSuccess(span, result, duration, metadata);
    span.end();

    logSuccess(trace, result, duration, metadata);
    trace.end();
    await opikClient.flush();

    return {
      result,
      traceData: {
        traceId: trace.data.id || '',
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

    logError(span, error, duration, metadata);
    span.end();

    logError(trace, error, duration, metadata);
    trace.end();
    await opikClient.flush();

    throw error;
  }
}

interface SequenceOperation {
  name: string;
  fn: () => Promise<unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Trace multiple operations in sequence
 */
export async function traceSequence<T>(
  traceName: string,
  operations: SequenceOperation[]
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
      results.push(result as T);
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

interface ParallelOperation {
  name: string;
  fn: () => Promise<unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Trace parallel operations
 */
export async function traceParallel<T>(
  traceName: string,
  operations: ParallelOperation[]
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
      return result as T;
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
  private trace: OpikTrace;
  private startTime: number;

  constructor(name: string, input: Record<string, unknown>, metadata?: Record<string, unknown>) {
    this.trace = createTrace(name, input, metadata);
    this.startTime = Date.now();
  }

  createSpan(name: string, type: 'llm' | 'tool' | 'general', input?: Record<string, unknown>): OpikSpan {
    return createSpan(this.trace, name, type, input);
  }

  logSuccess(output: unknown, metadata?: Record<string, unknown>) {
    const duration = Date.now() - this.startTime;
    logSuccess(this.trace, output, duration, metadata);
  }

  logError(error: Error | unknown, metadata?: Record<string, unknown>) {
    const duration = Date.now() - this.startTime;
    logError(this.trace, error, duration, metadata);
  }

  async end() {
    this.trace.end();
    await opikClient.flush();
  }

  getId(): string {
    return this.trace.data.id || '';
  }

  // Expose the underlying trace for use as a parent in trackOpenAI
  getTrace(): OpikTrace {
    return this.trace;
  }
}

const tracerExports = {
  createTrace,
  createSpan,
  logSuccess,
  logError,
  traceOperation,
  traceSequence,
  traceParallel,
  CustomTrace,
};

export default tracerExports;