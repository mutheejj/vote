// lib/hooks/useResults.ts
// Election results hook integrating with API services and real-time updates

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNotificationStore } from '../stores/notificationStore';
import { useAuth } from './useAuth';
import {
  ElectionResults,
  Result,
  PositionResult,
  ElectionStats,
  VotingAnalytics
} from '../types';
import {
  getElectionResults,
  getResultsSummary,
  getLiveStats,
  calculateResults,
  publishResults
} from '../api/results';

interface UseResultsOptions {
  electionId?: string;
  autoFetch?: boolean;
  pollingInterval?: number;
  enableLiveUpdates?: boolean;
}

interface UseResultsReturn {
  // State
  results: ElectionResults | null;
  summary: any | null;
  liveStats: any | null;
  isLoading: boolean;
  isCalculating: boolean;
  isPublishing: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Data Fetching
  fetchResults: (electionId: string) => Promise<ElectionResults>;
  fetchSummary: (electionId: string) => Promise<any>;
  fetchLiveStats: (electionId: string) => Promise<any>;
  refreshResults: (electionId?: string) => Promise<void>;

  // Admin Functions
  calculateElectionResults: (electionId: string) => Promise<ElectionResults>;
  publishElectionResults: (electionId: string) => Promise<void>;

  // Data Processing and Analytics
  getWinnersByPosition: () => PositionResult[];
  getTurnoutStatistics: () => { total: number; percentage: number; byPosition: any[] };
  getVotingTrends: () => any[];
  getTopPerformers: (limit?: number) => Result[];

  // Real-time Updates
  startLiveUpdates: (electionId: string) => void;
  stopLiveUpdates: () => void;

  // Export Functions
  exportResults: (electionId: string, format?: 'pdf' | 'csv' | 'excel') => Promise<void>;
  generateResultsReport: (electionId: string, includeCharts?: boolean) => Promise<any>;

  // Utility Functions
  clearResults: () => void;
  clearError: () => void;

  // Computed Properties
  hasResults: boolean;
  isResultsPublished: boolean;
  canViewResults: boolean;
  canManageResults: boolean;
  resultsSummary: {
    totalVotes: number;
    totalPositions: number;
    averageTurnout: number;
    topPosition: string;
  };
}

export function useResults(options: UseResultsOptions = {}): UseResultsReturn {
  const {
    electionId,
    autoFetch = true,
    pollingInterval = 10000, // 10 seconds
    enableLiveUpdates = true
  } = options;

  const { hasPermission, isAuthenticated } = useAuth();
  const { toast } = useNotificationStore();

  // State
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [liveStats, setLiveStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pollingInterval_, setPollingInterval_] = useState<NodeJS.Timeout | null>(null);

  // Auto-fetch results on mount
  useEffect(() => {
    if (autoFetch && electionId && isAuthenticated) {
      fetchResults(electionId);
      if (enableLiveUpdates) {
        startLiveUpdates(electionId);
      }
    }

    return () => {
      stopLiveUpdates();
    };
  }, [autoFetch, electionId, isAuthenticated, enableLiveUpdates]);

  // Data Fetching
  const fetchResults = useCallback(async (electionId: string): Promise<ElectionResults> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getElectionResults(electionId);
      const resultData = response.data.data!;

      setResults(resultData);
      setLastUpdated(new Date());

      return resultData;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch results';
      setError(message);
      toast.error('Results Fetch Failed', message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchSummary = useCallback(async (electionId: string): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getResultsSummary(electionId);
      const summaryData = response.data.data!;

      setSummary(summaryData);

      return summaryData;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch summary';
      setError(message);
      toast.error('Summary Fetch Failed', message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchLiveStats = useCallback(async (electionId: string): Promise<any> => {
    try {
      const response = await getLiveStats(electionId);
      const statsData = response.data.data!;

      setLiveStats(statsData);
      setLastUpdated(new Date());

      return statsData;
    } catch (error: any) {
      // Don't show toast for live stats errors to avoid spam
      console.error('Failed to fetch live stats:', error);
      throw error;
    }
  }, []);

  const refreshResults = useCallback(async (electionId?: string): Promise<void> => {
    const id = electionId || results?.electionId;
    if (!id) return;

    try {
      await Promise.all([
        fetchResults(id),
        fetchSummary(id),
        fetchLiveStats(id)
      ]);
    } catch (error) {
      console.error('Failed to refresh results:', error);
    }
  }, [results, fetchResults, fetchSummary, fetchLiveStats]);

  // Admin Functions
  const calculateElectionResults = useCallback(async (electionId: string): Promise<ElectionResults> => {
    if (!hasPermission('result:publish')) {
      throw new Error('Insufficient permissions to calculate results');
    }

    setIsCalculating(true);
    setError(null);

    try {
      const response = await calculateResults(electionId);
      const calculatedResults = response.data.data!;

      setResults(calculatedResults);
      setLastUpdated(new Date());

      toast.success('Results Calculated', 'Election results have been calculated successfully.');

      return calculatedResults;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to calculate results';
      setError(message);
      toast.error('Calculation Failed', message);
      throw error;
    } finally {
      setIsCalculating(false);
    }
  }, [hasPermission, toast]);

  const publishElectionResults = useCallback(async (electionId: string): Promise<void> => {
    if (!hasPermission('result:publish')) {
      throw new Error('Insufficient permissions to publish results');
    }

    setIsPublishing(true);
    setError(null);

    try {
      await publishResults(electionId);

      // Refresh results to get updated publication status
      await fetchResults(electionId);

      toast.success('Results Published', 'Election results have been published successfully.');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to publish results';
      setError(message);
      toast.error('Publish Failed', message);
      throw error;
    } finally {
      setIsPublishing(false);
    }
  }, [hasPermission, fetchResults, toast]);

  // Data Processing and Analytics
  const getWinnersByPosition = useCallback((): PositionResult[] => {
    if (!results?.positionResults) return [];

    return results.positionResults
      .filter(position => position.winner)
      .sort((a, b) => (a.position.order || 0) - (b.position.order || 0));
  }, [results]);

  const getTurnoutStatistics = useCallback(() => {
    if (!results) {
      return { total: 0, percentage: 0, byPosition: [] };
    }

    const byPosition = results.positionResults.map(position => ({
      positionName: position.position.name,
      totalVotes: position.totalVotes,
      turnoutPercentage: results.totalEligibleVoters > 0
        ? (position.totalVotes / results.totalEligibleVoters) * 100
        : 0
    }));

    return {
      total: results.totalVotes,
      percentage: results.turnoutPercentage,
      byPosition
    };
  }, [results]);

  const getVotingTrends = useCallback(() => {
    if (!liveStats?.votingTrends) return [];
    return liveStats.votingTrends;
  }, [liveStats]);

  const getTopPerformers = useCallback((limit: number = 5): Result[] => {
    if (!results?.positionResults) return [];

    const allResults = results.positionResults.flatMap(position => position.results);
    return allResults
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, limit);
  }, [results]);

  // Real-time Updates
  const startLiveUpdates = useCallback((electionId: string) => {
    if (pollingInterval_) {
      clearInterval(pollingInterval_);
    }

    const interval = setInterval(() => {
      fetchLiveStats(electionId);
    }, pollingInterval);

    setPollingInterval_(interval);
  }, [pollingInterval_, pollingInterval, fetchLiveStats]);

  const stopLiveUpdates = useCallback(() => {
    if (pollingInterval_) {
      clearInterval(pollingInterval_);
      setPollingInterval_(null);
    }
  }, [pollingInterval_]);

  // Export Functions
  const exportResults = useCallback(async (electionId: string, format: 'pdf' | 'csv' | 'excel' = 'pdf'): Promise<void> => {
    try {
      // This would typically trigger a download
      // Implementation depends on backend export endpoint
      const exportUrl = `/api/results/${electionId}/export?format=${format}`;

      // Create download link
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `election-results-${electionId}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export Started', `Results export in ${format.toUpperCase()} format has started.`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to export results';
      toast.error('Export Failed', message);
      throw error;
    }
  }, [toast]);

  const generateResultsReport = useCallback(async (electionId: string, includeCharts: boolean = true): Promise<any> => {
    try {
      // Generate a comprehensive results report
      const report = {
        election: results?.election,
        summary: {
          totalVotes: results?.totalVotes,
          totalEligibleVoters: results?.totalEligibleVoters,
          turnoutPercentage: results?.turnoutPercentage,
        },
        winners: getWinnersByPosition(),
        turnoutStats: getTurnoutStatistics(),
        topPerformers: getTopPerformers(),
        generatedAt: new Date(),
        includeCharts
      };

      return report;
    } catch (error: any) {
      const message = 'Failed to generate results report';
      toast.error('Report Generation Failed', message);
      throw error;
    }
  }, [results, getWinnersByPosition, getTurnoutStatistics, getTopPerformers, toast]);

  // Utility Functions
  const clearResults = useCallback(() => {
    setResults(null);
    setSummary(null);
    setLiveStats(null);
    setError(null);
    setLastUpdated(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Computed Properties
  const hasResults = useMemo(() => {
    return results !== null && results.positionResults.length > 0;
  }, [results]);

  const isResultsPublished = useMemo(() => {
    return results?.election?.status === 'COMPLETED' || false;
  }, [results]);

  const canViewResults = useMemo(() => {
    return hasPermission('result:read') || isResultsPublished;
  }, [hasPermission, isResultsPublished]);

  const canManageResults = useMemo(() => {
    return hasPermission('result:publish');
  }, [hasPermission]);

  const resultsSummary = useMemo(() => {
    if (!results) {
      return {
        totalVotes: 0,
        totalPositions: 0,
        averageTurnout: 0,
        topPosition: ''
      };
    }

    const positions = results.positionResults;
    const averageTurnout = positions.length > 0
      ? positions.reduce((sum, p) => sum + (p.totalVotes / results.totalEligibleVoters * 100), 0) / positions.length
      : 0;

    const topPosition = positions.reduce((top, current) =>
      current.totalVotes > top.totalVotes ? current : top,
      positions[0] || { position: { name: '' }, totalVotes: 0 }
    );

    return {
      totalVotes: results.totalVotes,
      totalPositions: positions.length,
      averageTurnout: Math.round(averageTurnout * 100) / 100,
      topPosition: topPosition.position.name
    };
  }, [results]);

  return {
    // State
    results,
    summary,
    liveStats,
    isLoading,
    isCalculating,
    isPublishing,
    error,
    lastUpdated,

    // Data Fetching
    fetchResults,
    fetchSummary,
    fetchLiveStats,
    refreshResults,

    // Admin Functions
    calculateElectionResults,
    publishElectionResults,

    // Data Processing and Analytics
    getWinnersByPosition,
    getTurnoutStatistics,
    getVotingTrends,
    getTopPerformers,

    // Real-time Updates
    startLiveUpdates,
    stopLiveUpdates,

    // Export Functions
    exportResults,
    generateResultsReport,

    // Utility Functions
    clearResults,
    clearError,

    // Computed Properties
    hasResults,
    isResultsPublished,
    canViewResults,
    canManageResults,
    resultsSummary
  };
}

export default useResults;