// lib/hooks/useElections.ts
// Elections management hook integrating with electionStore and API services

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useElectionStore } from '../stores/electionStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useAuth } from './useAuth';
import {
  Election,
  CreateElectionData,
  UpdateElectionData,
  ElectionFilters,
  ElectionStats,
  PaginatedResponse
} from '../types';
import {
  getElections,
  getActiveElections,
  getEligibleElections,
  getElectionById,
  createElection,
  updateElection,
  startElection,
  endElection,
  pauseElection,
  resumeElection,
  archiveElection,
  deleteElection,
  getElectionStats,
  addEligibleVoters,
  removeEligibleVoters
} from '../api/elections';

interface UseElectionsOptions {
  autoFetch?: boolean;
  initialFilters?: ElectionFilters;
  pollingInterval?: number;
}

interface UseElectionsReturn {
  // State
  elections: Election[];
  activeElections: Election[];
  eligibleElections: Election[];
  currentElection: Election | null;
  isLoading: boolean;
  error: string | null;
  filters: ElectionFilters;

  // CRUD Operations
  fetchElections: (filters?: ElectionFilters, page?: number, limit?: number) => Promise<PaginatedResponse<Election>>;
  fetchActiveElections: () => Promise<Election[]>;
  fetchEligibleElections: () => Promise<Election[]>;
  fetchElection: (id: string) => Promise<Election>;
  createNewElection: (data: CreateElectionData) => Promise<Election>;
  updateExistingElection: (id: string, data: UpdateElectionData) => Promise<Election>;
  deleteExistingElection: (id: string) => Promise<void>;

  // Election Management
  startElectionById: (id: string) => Promise<Election>;
  endElectionById: (id: string) => Promise<Election>;
  pauseElectionById: (id: string) => Promise<Election>;
  resumeElectionById: (id: string) => Promise<Election>;
  archiveElectionById: (id: string) => Promise<Election>;

  // Voter Management
  addVotersToElection: (id: string, voterIds: string[]) => Promise<void>;
  removeVotersFromElection: (id: string, voterIds: string[]) => Promise<void>;

  // Statistics and Analytics
  getElectionStatistics: (id: string) => Promise<ElectionStats>;

  // Utility functions
  setCurrentElection: (election: Election | null) => void;
  clearCurrentElection: () => void;
  setFilters: (filters: ElectionFilters) => void;
  clearError: () => void;
  refreshElections: () => Promise<void>;

  // Computed properties
  canCreateElection: boolean;
  canManageElections: boolean;
  hasActiveElections: boolean;
  hasEligibleElections: boolean;
}

export function useElections(options: UseElectionsOptions = {}): UseElectionsReturn {
  const {
    autoFetch = true,
    initialFilters = {},
    pollingInterval = 30000 // 30 seconds
  } = options;

  const { hasPermission, isAuthenticated } = useAuth();
  const { toast } = useNotificationStore();

  const {
    elections,
    activeElections,
    eligibleElections,
    currentElection,
    isLoading,
    error,
    filters,
    hasInitialFetch,
    fetchElections: storeFetchElections,
    fetchActiveElections: storeFetchActiveElections,
    fetchEligibleElections: storeFetchEligibleElections,
    fetchElection: storeFetchElection,
    createNewElection: storeCreateElection,
    updateExistingElection: storeUpdateElection,
    startElectionById: storeStartElection,
    endElectionById: storeEndElection,
    setCurrentElection,
    setFilters,
    clearError,
    clearCurrentElection
  } = useElectionStore();

  // Local state for pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Initialize filters and fetch data on mount - ONCE GLOBALLY
  useEffect(() => {
    // Skip if:
    // 1. Global store already fetched data
    // 2. Currently loading
    // 3. AutoFetch is disabled
    // 4. User not authenticated
    if (hasInitialFetch || isLoading || !autoFetch || !isAuthenticated) {
      return;
    }

    const initializeFetch = async () => {
      if (Object.keys(initialFilters).length > 0) {
        setFilters(initialFilters);
      }

      try {
        // Fetch all data in parallel
        await Promise.all([
          storeFetchElections(initialFilters),
          storeFetchActiveElections(),
          storeFetchEligibleElections()
        ]);
      } catch (err) {
        console.error('Failed to initialize elections:', err);
      }
    };

    initializeFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array - only run once on mount

  // Polling for active elections to keep data fresh
  useEffect(() => {
    // Skip if polling disabled or not authenticated
    if (!pollingInterval || pollingInterval <= 0 || !isAuthenticated) {
      return;
    }

    const pollActiveElections = async () => {
      try {
        await Promise.all([
          storeFetchActiveElections(),
          storeFetchElections(filters)
        ]);
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // Set up polling interval
    const intervalId = setInterval(pollActiveElections, pollingInterval);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [pollingInterval, isAuthenticated, storeFetchActiveElections, storeFetchElections, filters]);

  // CRUD Operations
  const fetchElections = useCallback(async (
    filters?: ElectionFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Election>> => {
    try {
      const response = await getElections({ page, limit, filters });
      const data = response.data.data!;

      // Update store
      storeFetchElections(filters);

      // Update pagination - with null safety
      if (data && data.pagination) {
        setPagination({
          page: data.pagination.page || page,
          limit: data.pagination.limit || limit,
          total: data.pagination.total || 0,
          totalPages: data.pagination.totalPages || 0
        });
      } else {
        // Fallback pagination if API doesn't return pagination data
        setPagination({
          page,
          limit,
          total: 0,
          totalPages: 0
        });
      }

      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch elections';
      toast.error('Fetch Failed', message);
      throw error;
    }
  }, [storeFetchElections, toast]);

  const fetchActiveElections = useCallback(async (): Promise<Election[]> => {
    try {
      await storeFetchActiveElections();
      return activeElections;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch active elections';
      toast.error('Fetch Failed', message);
      throw error;
    }
  }, [storeFetchActiveElections, activeElections, toast]);

  const fetchEligibleElections = useCallback(async (): Promise<Election[]> => {
    try {
      await storeFetchEligibleElections();
      return eligibleElections;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch eligible elections';
      toast.error('Fetch Failed', message);
      throw error;
    }
  }, [storeFetchEligibleElections, eligibleElections, toast]);

  const fetchElection = useCallback(async (id: string): Promise<Election> => {
    try {
      // Call API directly to avoid stale closure issue with currentElection
      const response = await getElectionById(id);
      const election = response.data.data;

      if (!election) {
        throw new Error('Election not found');
      }

      // Update store with the fetched election
      setCurrentElection(election);

      return election;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch election';
      toast.error('Fetch Failed', message);
      throw error;
    }
  }, [setCurrentElection, toast]);

  const createNewElection = useCallback(async (data: CreateElectionData): Promise<Election> => {
    try {
      const election = await storeCreateElection(data);
      // Don't show toast here - let the calling component handle success feedback
      return election;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create election';
      toast.error('Create Failed', message);
      throw error;
    }
  }, [storeCreateElection, toast]);

  const updateExistingElection = useCallback(async (
    id: string,
    data: UpdateElectionData
  ): Promise<Election> => {
    try {
      const election = await storeUpdateElection(id, data);
      toast.success('Election Updated', 'Election has been updated successfully.');

      return election;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update election';
      toast.error('Update Failed', message);
      throw error;
    }
  }, [storeUpdateElection, toast]);

  const deleteExistingElection = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteElection(id);
      toast.success('Election Deleted', 'Election has been deleted successfully.');

      // Refresh elections list
      await refreshElections();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete election';
      toast.error('Delete Failed', message);
      throw error;
    }
  }, [toast]);

  // Election Management
  const startElectionById = useCallback(async (id: string): Promise<Election> => {
    try {
      await storeStartElection(id);

      if (!currentElection) {
        throw new Error('Election not found');
      }

      toast.success('Election Started', 'Election has been started successfully.');

      // Refresh active elections
      await fetchActiveElections();

      return currentElection;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to start election';
      toast.error('Start Failed', message);
      throw error;
    }
  }, [storeStartElection, currentElection, fetchActiveElections, toast]);

  const endElectionById = useCallback(async (id: string): Promise<Election> => {
    try {
      await storeEndElection(id);

      if (!currentElection) {
        throw new Error('Election not found');
      }

      toast.success('Election Ended', 'Election has been ended successfully.');

      // Refresh elections
      await refreshElections();

      return currentElection;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to end election';
      toast.error('End Failed', message);
      throw error;
    }
  }, [storeEndElection, currentElection, toast]);

  const pauseElectionById = useCallback(async (id: string): Promise<Election> => {
    try {
      const response = await pauseElection(id);
      const election = response.data.data!;

      // Update store
      useElectionStore.setState((state) => ({
        elections: state.elections.map(e => e.id === id ? election : e),
        currentElection: state.currentElection?.id === id ? election : state.currentElection
      }));

      toast.success('Election Paused', 'Election has been paused successfully.');

      return election;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to pause election';
      toast.error('Pause Failed', message);
      throw error;
    }
  }, [toast]);

  const resumeElectionById = useCallback(async (id: string): Promise<Election> => {
    try {
      const response = await resumeElection(id);
      const election = response.data.data!;

      // Update store
      useElectionStore.setState((state) => ({
        elections: state.elections.map(e => e.id === id ? election : e),
        currentElection: state.currentElection?.id === id ? election : state.currentElection
      }));

      toast.success('Election Resumed', 'Election has been resumed successfully.');

      return election;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to resume election';
      toast.error('Resume Failed', message);
      throw error;
    }
  }, [toast]);

  const archiveElectionById = useCallback(async (id: string): Promise<Election> => {
    try {
      const response = await archiveElection(id);
      const election = response.data.data!;

      // Update store
      useElectionStore.setState((state) => ({
        elections: state.elections.map(e => e.id === id ? election : e),
        currentElection: state.currentElection?.id === id ? election : state.currentElection
      }));

      toast.success('Election Archived', 'Election has been archived successfully.');

      return election;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to archive election';
      toast.error('Archive Failed', message);
      throw error;
    }
  }, [toast]);

  // Voter Management
  const addVotersToElection = useCallback(async (id: string, voterIds: string[]): Promise<void> => {
    try {
      await addEligibleVoters(id, voterIds);
      toast.success('Voters Added', `${voterIds.length} voters added to election.`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add voters';
      toast.error('Add Voters Failed', message);
      throw error;
    }
  }, [toast]);

  const removeVotersFromElection = useCallback(async (id: string, voterIds: string[]): Promise<void> => {
    try {
      await removeEligibleVoters(id, voterIds);
      toast.success('Voters Removed', `${voterIds.length} voters removed from election.`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to remove voters';
      toast.error('Remove Voters Failed', message);
      throw error;
    }
  }, [toast]);

  // Statistics and Analytics
  const getElectionStatistics = useCallback(async (id: string): Promise<ElectionStats> => {
    try {
      const response = await getElectionStats(id);
      return response.data.data!;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to get election statistics';
      toast.error('Stats Failed', message);
      throw error;
    }
  }, [toast]);

  // Utility functions
  const refreshElections = useCallback(async (): Promise<void> => {
    try {
      await Promise.all([
        fetchElections(filters),
        fetchActiveElections(),
        fetchEligibleElections()
      ]);
    } catch (error) {
      console.error('Failed to refresh elections:', error);
    }
  }, [filters, fetchElections, fetchActiveElections, fetchEligibleElections]);

  // Computed properties
  const canCreateElection = useMemo(() => {
    return hasPermission('election:create');
  }, [hasPermission]);

  const canManageElections = useMemo(() => {
    return hasPermission('election:update') || hasPermission('election:delete');
  }, [hasPermission]);

  const hasActiveElections = useMemo(() => {
    return activeElections.length > 0;
  }, [activeElections]);

  const hasEligibleElections = useMemo(() => {
    return eligibleElections.length > 0;
  }, [eligibleElections]);

  return {
    // State
    elections,
    activeElections,
    eligibleElections,
    currentElection,
    isLoading,
    error,
    filters,

    // CRUD Operations
    fetchElections,
    fetchActiveElections,
    fetchEligibleElections,
    fetchElection,
    createNewElection,
    updateExistingElection,
    deleteExistingElection,

    // Election Management
    startElectionById,
    endElectionById,
    pauseElectionById,
    resumeElectionById,
    archiveElectionById,

    // Voter Management
    addVotersToElection,
    removeVotersFromElection,

    // Statistics and Analytics
    getElectionStatistics,

    // Utility functions
    setCurrentElection,
    clearCurrentElection,
    setFilters,
    clearError,
    refreshElections,

    // Computed properties
    canCreateElection,
    canManageElections,
    hasActiveElections,
    hasEligibleElections
  };
}

export default useElections;