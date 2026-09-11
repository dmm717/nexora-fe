'use client';

import React from 'react';
import { useNextRecommendation } from '@/hooks/queries/useNextRecommendation';
import {
  NextPracticeRecommendationContent,
  type NextPracticeRecommendationContentProps,
} from './NextPracticeRecommendationContent';

export interface NextPracticeRecommendationCardProps {
  /**
   * Optional manual override. If passed, the component operates in controlled/pure mode.
   * If not passed, it executes useNextRecommendation() to fetch standalone B12 data.
   */
  recommendation?: NextPracticeRecommendationContentProps['recommendation'];
  isLoading?: boolean;
}

/**
 * Standalone B12 wrapper component.
 * Calls useNextRecommendation() and passes query state to NextPracticeRecommendationContent.
 */
export default function NextPracticeRecommendationCard() {
  const query = useNextRecommendation();

  return (
    <NextPracticeRecommendationContent
      recommendation={query.data}
      isLoading={query.isLoading}
      error={query.error}
      refetch={query.refetch}
      isFetching={query.isFetching}
    />
  );
}

export { NextPracticeRecommendationContent };
