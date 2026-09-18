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
