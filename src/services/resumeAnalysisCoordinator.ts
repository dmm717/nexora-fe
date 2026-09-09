import { ApiError } from './apiClient';
import { AnalysisView, cvAnalysisApi } from './cvAnalysisApi';

export type ResumeAnalysisStage = 'creating-jd' | 'analyzing' | 'recovering';

export interface ResumeAnalysisOperation {
  userId: string;
  idempotencyKey: string;
  resumeId: string;
  jobDescriptionId: string | null;
  analysisId: string | null;
  jdTitle: string;
  jdContent: string;
  timestamp: string;
}

export interface ResumeAnalysisCoordinatorOptions {
  signal?: AbortSignal;
  save: (operation: ResumeAnalysisOperation) => void;
  onStage?: (stage: ResumeAnalysisStage) => void;
}

export function createResumeAnalysisOperation(input: Omit<ResumeAnalysisOperation, 'idempotencyKey' | 'timestamp'>): ResumeAnalysisOperation {
  return {
    ...input,
    idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
  };
}

const inFlight = new Map<string, Promise<AnalysisView>>();
const MAX_TRANSPORT_RETRIES = 3;
const MAX_READY_RETRIES = 15;

function operationKey(operation: ResumeAnalysisOperation): string {
  return `${operation.userId}:${operation.idempotencyKey}`;
}

function throwIfAborted(signal?: AbortSignal): void {
  signal?.throwIfAborted();
}

function isTransportFailure(error: unknown): boolean {
  // ApiError represents a completed HTTP response; only an absent/unknown
  // response can safely be replayed with the same idempotency key.
  return !(error instanceof ApiError);
}

function wait(milliseconds: number, signal?: AbortSignal): Promise<void> {
  throwIfAborted(signal);
  return new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(resolve, milliseconds);
    const onAbort = () => {
      globalThis.clearTimeout(timer);
      reject(signal?.reason ?? new DOMException('The operation was aborted.', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function withTransportRetry<T>(
  action: () => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    throwIfAborted(signal);
    try {
      return await action();
    } catch (error) {
      throwIfAborted(signal);
      if (attempt >= MAX_TRANSPORT_RETRIES || !isTransportFailure(error)) throw error;
      await wait(250 * attempt, signal);
    }
  }
}

async function createAnalysisWithRetry(
  operation: ResumeAnalysisOperation,
  signal?: AbortSignal,
): Promise<AnalysisView> {
  let readyAttempt = 0;
  while (true) {
    try {
      return await withTransportRetry(
        () => cvAnalysisApi.analyze(
          { resumeId: operation.resumeId, jobDescriptionId: operation.jobDescriptionId! },
          operation.idempotencyKey,
          { signal },
        ),
        signal,
      );
    } catch (error) {
      if (!(error instanceof ApiError) || error.code !== 'RESUME_NOT_READY' || readyAttempt >= MAX_READY_RETRIES) {
        throw error;
      }
      readyAttempt += 1;
      await wait(2000, signal);
    }
  }
}

async function execute(
  initialOperation: ResumeAnalysisOperation,
  options: ResumeAnalysisCoordinatorOptions,
): Promise<AnalysisView> {
  const { signal, save, onStage } = options;
  throwIfAborted(signal);

  if (initialOperation.analysisId) {
    onStage?.('recovering');
    return withTransportRetry(
      () => cvAnalysisApi.getAnalysis(initialOperation.analysisId!, { signal }),
      signal,
    );
  }

  let operation = initialOperation;
  if (!operation.jobDescriptionId) {
    onStage?.('creating-jd');
    const jobDescription = await withTransportRetry(
      () => cvAnalysisApi.createJobDescription(
        { title: operation.jdTitle, content: operation.jdContent },
        operation.idempotencyKey,
        { signal },
      ),
      signal,
    );
    operation = { ...operation, jobDescriptionId: jobDescription.id };
    save(operation);
  }

  onStage?.('analyzing');
  const analysis = await createAnalysisWithRetry(operation, signal);
  save({ ...operation, analysisId: analysis.id });
  return analysis;
}

/** Run one persisted operation; repeated clicks share the same promise. */
export function runResumeAnalysisOperation(
  operation: ResumeAnalysisOperation,
  options: ResumeAnalysisCoordinatorOptions,
): Promise<AnalysisView> {
  const key = operationKey(operation);
  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = execute(operation, options).finally(() => {
    if (inFlight.get(key) === promise) inFlight.delete(key);
  });
  inFlight.set(key, promise);
  return promise;
}
