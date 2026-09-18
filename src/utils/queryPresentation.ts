export interface QueryPresentationInput {
  /** Caller-defined authority: empty arrays may still be valid loaded data. */
  hasData: boolean;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
}

export interface QueryPresentation {
  showInitialLoading: boolean;
  showBlockingError: boolean;
  showBackgroundError: boolean;
  showRefreshing: boolean;
}

/**
 * Derive display semantics without inspecting the query's value. Callers decide
 * whether their data is usable; in particular, a successfully loaded [] is data.
 */
export function getQueryPresentation({
  hasData,
  isLoading,
  isError,
  isFetching,
}: QueryPresentationInput): QueryPresentation {
  return {
    showInitialLoading: isLoading && !hasData,
    showBlockingError: isError && !hasData,
    showBackgroundError: isError && hasData,
    showRefreshing: isFetching && hasData,
  };
}

export type LearningPathDomainState = 'no_goal' | 'not_created' | 'normal';

export interface LearningPathQueryPresentationInput<T> extends Omit<QueryPresentationInput, 'hasData'> {
  data: T | undefined;
  errorCode?: string;
  errorStatus?: number;
}

export interface LearningPathQueryPresentation<T> extends QueryPresentation {
  domainState: LearningPathDomainState;
  data: T | undefined;
}

/**
 * Learning Path's authoritative domain responses must override data retained
 * by React Query. Other errors keep the generic cached-data behavior.
 */
export function getLearningPathPresentation<T>({
  data,
  errorCode,
  errorStatus,
  isLoading,
  isError,
  isFetching,
}: LearningPathQueryPresentationInput<T>): LearningPathQueryPresentation<T> {
  const domainState: LearningPathDomainState =
    errorCode === 'ACTIVE_CAREER_GOAL_REQUIRED'
      ? 'no_goal'
      : errorCode === 'LEARNING_PATH_NOT_FOUND' || errorStatus === 404
        ? 'not_created'
        : 'normal';
  const isDomainResponse = domainState !== 'normal';
  const effectiveData = isDomainResponse ? undefined : data;

  return {
    domainState,
    data: effectiveData,
    ...getQueryPresentation({
      hasData: effectiveData !== undefined,
      isLoading: isLoading && !isDomainResponse,
      isError: isError && !isDomainResponse,
      isFetching: isFetching && !isDomainResponse,
    }),
  };
}

export interface ProgressDashboardQueryPresentationInput extends QueryPresentationInput {
  featureLocked: boolean;
}

export interface ProgressDashboardQueryPresentation extends QueryPresentation {
  hasData: boolean;
}

export function isProgressDashboardFeatureLocked(
  error: { code?: string; status?: number } | null | undefined,
): boolean {
  return Boolean(
    error && (error.code === 'FEATURE_NOT_AVAILABLE' || error.status === 403),
  );
}

/** Prevent cached premium metrics from overriding a current entitlement lock. */
export function getProgressDashboardPresentation({
  hasData,
  isLoading,
  isError,
  isFetching,
  featureLocked,
}: ProgressDashboardQueryPresentationInput): ProgressDashboardQueryPresentation {
  const hasUsableData = hasData && !featureLocked;

  return {
    hasData: hasUsableData,
    ...getQueryPresentation({
      hasData: hasUsableData,
      isLoading: isLoading && !featureLocked,
      isError: isError && !featureLocked,
      isFetching: isFetching && !featureLocked,
    }),
  };
}
