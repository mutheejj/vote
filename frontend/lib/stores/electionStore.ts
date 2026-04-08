// lib/stores/electionStore.ts
// Elections Zustand store

import { create } from 'zustand';
import { Election, CreateElectionData, ElectionFilters } from '../types';
import {
  getElections,
  getActiveElections,
  getEligibleElections,
  getElectionById,
  createElection,
  updateElection,
  startElection,
  endElection,
} from '../api/elections';

interface ElectionState {
  elections: Election[];
  activeElections: Election[];
  eligibleElections: Election[];
  currentElection: Election | null;
  isLoading: boolean;
  error: string | null;
  filters: ElectionFilters;
  hasInitialFetch: boolean; // Track if initial fetch has been completed
}

interface ElectionActions {
  fetchElections: (filters?: ElectionFilters) => Promise<void>;
  fetchActiveElections: () => Promise<void>;
  fetchEligibleElections: () => Promise<void>;
  fetchElection: (id: string) => Promise<void>;
  createNewElection: (data: CreateElectionData) => Promise<Election>;
  updateExistingElection: (id: string, data: Partial<CreateElectionData>) => Promise<Election>;
  startElectionById: (id: string) => Promise<void>;
  endElectionById: (id: string) => Promise<void>;
  setCurrentElection: (election: Election | null) => void;
  setFilters: (filters: ElectionFilters) => void;
  clearError: () => void;
  clearCurrentElection: () => void;
}

export const useElectionStore = create<ElectionState & ElectionActions>((set, get) => ({
  // State
  elections: [],
  activeElections: [],
  eligibleElections: [],
  currentElection: null,
  isLoading: false,
  error: null,
  filters: {},
  hasInitialFetch: false,

  // Actions
  fetchElections: async (filters?: ElectionFilters) => {
    // Prevent duplicate fetches if already loading OR already fetched
    if (get().isLoading || get().hasInitialFetch) {
      return;
    }

    // Set BOTH flags immediately to prevent race conditions
    set({ isLoading: true, hasInitialFetch: true, error: null });
    try {
      const response = await getElections({ filters });
      const elections = response.data.data!.data;

      set({
        elections,
        isLoading: false,
        filters: filters || {},
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch elections',
      });
    }
  },

  fetchActiveElections: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getActiveElections();
      const activeElections = response.data.data!;

      set({
        activeElections,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch active elections',
      });
    }
  },

  fetchEligibleElections: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getEligibleElections();
      const eligibleElections = response.data.data!;

      set({
        eligibleElections,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch eligible elections',
      });
    }
  },

  fetchElection: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getElectionById(id);
      const election = response.data.data!;

      set({
        currentElection: election,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch election',
      });
    }
  },

  createNewElection: async (data: CreateElectionData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await createElection(data);
      const newElection = response.data.data!;

      set((state) => ({
        elections: [newElection, ...state.elections],
        isLoading: false,
      }));

      return newElection;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to create election',
      });
      throw error;
    }
  },

  updateExistingElection: async (id: string, data: Partial<CreateElectionData>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await updateElection(id, data);
      const updatedElection = response.data.data!;

      set((state) => ({
        elections: state.elections.map((election) =>
          election.id === id ? updatedElection : election
        ),
        currentElection: state.currentElection?.id === id ? updatedElection : state.currentElection,
        isLoading: false,
      }));

      return updatedElection;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to update election',
      });
      throw error;
    }
  },

  startElectionById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await startElection(id);
      const updatedElection = response.data.data!;

      set((state) => ({
        elections: state.elections.map((election) =>
          election.id === id ? updatedElection : election
        ),
        currentElection: state.currentElection?.id === id ? updatedElection : state.currentElection,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to start election',
      });
      throw error;
    }
  },

  endElectionById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await endElection(id);
      const updatedElection = response.data.data!;

      set((state) => ({
        elections: state.elections.map((election) =>
          election.id === id ? updatedElection : election
        ),
        currentElection: state.currentElection?.id === id ? updatedElection : state.currentElection,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to end election',
      });
      throw error;
    }
  },

  setCurrentElection: (election: Election | null) => {
    set({ currentElection: election });
  },

  setFilters: (filters: ElectionFilters) => {
    set({ filters });
  },

  clearError: () => set({ error: null }),

  clearCurrentElection: () => set({ currentElection: null }),
}));