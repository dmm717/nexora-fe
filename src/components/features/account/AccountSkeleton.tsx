import React from 'react';
import { Card } from '@/components/ui/Card';

/**
 * Layout-aware skeleton for the Account Settings surface.
 * Replaces legacy raw text strings with a structured, shimmering preview.
 */
export const AccountSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-pulse" aria-busy="true">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-outline-variant/40">
        <div className="space-y-3">
          <div className="w-36 h-5 rounded-full bg-surface-container-high" />
          <div className="w-64 sm:w-80 h-8 rounded-xl bg-surface-container-high" />
          <div className="w-72 sm:w-96 h-4 rounded bg-surface-container" />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high" />
          <div className="space-y-2">
            <div className="w-32 h-4 rounded bg-surface-container-high" />
            <div className="w-44 h-3 rounded bg-surface-container" />
          </div>
        </div>
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Personal Information (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          <Card variant="elevated" padding="lg" className="space-y-6">
            <div className="space-y-2">
              <div className="w-48 h-6 rounded bg-surface-container-high" />
              <div className="w-64 h-3.5 rounded bg-surface-container" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="w-24 h-4 rounded bg-surface-container" />
                <div className="w-full h-10 rounded-lg bg-surface-container-low" />
              </div>
              <div className="space-y-2">
                <div className="w-16 h-4 rounded bg-surface-container" />
                <div className="w-full h-10 rounded-lg bg-surface-container-low" />
              </div>
              <div className="space-y-2">
                <div className="w-36 h-4 rounded bg-surface-container" />
                <div className="w-full h-10 rounded-lg bg-surface-container-low" />
              </div>
            </div>
            <div className="w-36 h-10 rounded-lg bg-surface-container-high" />
          </Card>

          {/* Privacy & Data Skeleton */}
          <Card variant="elevated" padding="lg" className="space-y-4">
            <div className="w-44 h-6 rounded bg-surface-container-high" />
            <div className="w-full h-12 rounded bg-surface-container-low" />
            <div className="w-40 h-10 rounded-lg bg-surface-container-high" />
          </Card>
        </div>

        {/* Right Column: Security & Plan (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-8">
          {/* Security Card Skeleton */}
          <Card variant="elevated" padding="lg" className="space-y-6">
            <div className="space-y-2">
              <div className="w-32 h-6 rounded bg-surface-container-high" />
              <div className="w-56 h-3.5 rounded bg-surface-container" />
            </div>
            <div className="space-y-4">
              <div className="w-full h-10 rounded-lg bg-surface-container-low" />
              <div className="w-full h-10 rounded-lg bg-surface-container-low" />
              <div className="w-full h-10 rounded-lg bg-surface-container-low" />
            </div>
            <div className="w-32 h-10 rounded-lg bg-surface-container-high" />
          </Card>

          {/* Plan & Usage Card Skeleton */}
          <Card variant="elevated" padding="lg" className="space-y-4">
            <div className="w-36 h-6 rounded bg-surface-container-high" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 rounded-xl bg-surface-container-low" />
              <div className="h-16 rounded-xl bg-surface-container-low" />
              <div className="h-16 rounded-xl bg-surface-container-low" />
              <div className="h-16 rounded-xl bg-surface-container-low" />
            </div>
          </Card>

          {/* Sessions Skeleton */}
          <Card variant="elevated" padding="lg" className="space-y-4">
            <div className="w-36 h-6 rounded bg-surface-container-high" />
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-32 h-9 rounded-lg bg-surface-container-high" />
              <div className="w-48 h-9 rounded-lg bg-surface-container-low" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default AccountSkeleton;
