// lib/stores/votingStore.ts
// Voting session Zustand store

import { create } from 'zustand';
import { BallotData, VotingSession, VoteReceipt, PositionVote } from '../types';
import {
  startVotingSession,
  castVotes,
  getVotingStatus,
  validateBallot,
  getVotingHistory
} from '../api/votes';

interface VotingState {
  currentSession: VotingSession | null;
  currentBallot: BallotData | null;
  votedElections: string[];
  votingHistory: VoteReceipt[];
  isVoting: boolean;
  isLoading: boolean;
  error: string | null;
  validationErrors: string[];
}

interface VotingActions {
  startSession: (electionId: string) => Promise<VotingSession>;
  updateBallot: (electionId: string, sessionId: string, votes: PositionVote[]) => void;
  validateCurrentBallot: () => Promise<boolean>;
  submitVote: () => Promise<VoteReceipt>;
  checkVotingStatus: (electionId: string) => Promise<{ hasVoted: boolean; sessionId?: string }>;
  fetchVotingHistory: () => Promise<void>;
  clearCurrentSession: () => void;
  clearCurrentBallot: () => void;
  clearError: () => void;
  addVotedElection: (electionId: string) => void;
}

export const useVotingStore = create<VotingState & VotingActions>((set, get) => ({
  // State
  currentSession: null,
  currentBallot: null,
  votedElections: [],
  votingHistory: [],
  isVoting: false,
  isLoading: false,
  error: null,
  validationErrors: [],

  // Actions
  startSession: async (electionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await startVotingSession(electionId);
      const session = response.data.data!;

      set({
        currentSession: session,
        currentBallot: {
          electionId,
          sessionId: session.id,
          votes: [],
        },
        isLoading: false,
      });

      return session;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to start voting session',
      });
      throw error;
    }
  },

  updateBallot: (electionId: string, sessionId: string, votes: PositionVote[]) => {
    console.log('Store updateBallot called with:', { electionId, sessionId, votes });
    const newBallot = {
      electionId,
      sessionId,
      votes,
      deviceFingerprint: get().currentBallot?.deviceFingerprint,
    };
    console.log('Setting currentBallot to:', newBallot);
    set({
      currentBallot: newBallot,
    });
  },

  validateCurrentBallot: async () => {
    const { currentBallot } = get();
    console.log('validateCurrentBallot - currentBallot:', currentBallot);

    if (!currentBallot) {
      set({ error: 'No ballot to validate' });
      return false;
    }

    set({ isLoading: true, error: null, validationErrors: [] });
    try {
      console.log('Calling validateBallot API with:', currentBallot);
      const response = await validateBallot(currentBallot);
      const { valid, errors } = response.data.data!;

      set({
        isLoading: false,
        validationErrors: errors || [],
      });

      return valid;
    } catch (error: any) {
      console.error('validateBallot API error:', error);
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to validate ballot',
      });
      return false;
    }
  },

  submitVote: async () => {
    const { currentBallot } = get();
    if (!currentBallot) {
      throw new Error('No ballot to submit');
    }

    set({ isVoting: true, error: null });
    try {
      const response = await castVotes(currentBallot);
      const receipt = response.data.data!;

      set((state) => ({
        isVoting: false,
        votedElections: [...state.votedElections, currentBallot.electionId],
        votingHistory: [receipt, ...state.votingHistory],
      }));

      // Clear current session and ballot after successful vote
      get().clearCurrentSession();
      get().clearCurrentBallot();

      return receipt;
    } catch (error: any) {
      set({
        isVoting: false,
        error: error.response?.data?.message || 'Failed to submit vote',
      });
      throw error;
    }
  },

  checkVotingStatus: async (electionId: string) => {
    try {
      const response = await getVotingStatus(electionId);
      const status = response.data.data!;

      if (status.hasVoted) {
        get().addVotedElection(electionId);
      }

      return status;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to check voting status',
      });
      throw error;
    }
  },

  fetchVotingHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getVotingHistory();
      const history = response.data.data!;

      // Extract voted election IDs from history
      const votedElectionIds = history.map((receipt) => receipt.electionId);

      set({
        votingHistory: history,
        votedElections: votedElectionIds,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch voting history',
      });
    }
  },

  clearCurrentSession: () => {
    set({ currentSession: null });
  },

  clearCurrentBallot: () => {
    set({ currentBallot: null, validationErrors: [] });
  },

  clearError: () => {
    set({ error: null, validationErrors: [] });
  },

  addVotedElection: (electionId: string) => {
    set((state) => ({
      votedElections: state.votedElections.includes(electionId)
        ? state.votedElections
        : [...state.votedElections, electionId],
    }));
  },
}));