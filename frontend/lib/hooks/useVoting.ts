// lib/hooks/useVoting.ts
// Voting functionality hook integrating with votingStore and API services

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useVotingStore } from '../stores/votingStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useAuth } from './useAuth';
import {
  BallotData,
  VotingSession,
  VoteReceipt,
  PositionVote,
  ElectionBallot,
  VotingSessionDetails
} from '../types';
import {
  startVotingSession,
  endVotingSession,
  getVotingSession,
  extendVotingSession,
  completeVotingSession,
  castVotes,
  verifyVote,
  getVerificationStatus,
  validateBallot,
  getElectionBallot,
  getVotingStatus,
  getVoteReceipt,
  getVotingHistory,
  reportVotingIssue,
  generateVotingDeviceFingerprint,
  saveVotingSession,
  getSavedVotingSession,
  clearVotingSession,
  isVotingSessionValid
} from '../api/votes';

interface UseVotingOptions {
  electionId?: string;
  autoStartSession?: boolean;
  sessionTimeout?: number;
  enableAutoSave?: boolean;
}

interface UseVotingReturn {
  // State
  currentSession: VotingSession | null;
  currentBallot: BallotData | null;
  votedElections: string[];
  votingHistory: VoteReceipt[];
  isVoting: boolean;
  isLoading: boolean;
  error: string | null;
  validationErrors: string[];

  // Session Management
  startSession: (electionId: string) => Promise<VotingSession>;
  endSession: (sessionId?: string) => Promise<void>;
  extendSession: (sessionId?: string, minutes?: number) => Promise<VotingSession>;
  completeSession: (sessionId?: string) => Promise<VotingSession>;
  getSessionDetails: (sessionId: string) => Promise<VotingSession>;

  // Ballot Management
  getBallot: (electionId: string) => Promise<ElectionBallot>;
  updateBallot: (votes: PositionVote[]) => void;
  validateCurrentBallot: () => Promise<boolean>;
  clearBallot: () => void;
  saveBallotDraft: () => void;
  loadBallotDraft: () => void;

  // Voting Actions
  submitVote: () => Promise<VoteReceipt>;
  verifyVoteReceipt: (verificationCode: string) => Promise<{ verified: boolean; receipt?: VoteReceipt }>;
  getVoteVerificationStatus: (verificationCode: string) => Promise<{ status: string; verified: boolean }>;

  // Voting Status
  checkVotingStatus: (electionId: string) => Promise<{ hasVoted: boolean; sessionId?: string }>;
  hasVotedInElection: (electionId: string) => boolean;

  // History and Receipts
  fetchVotingHistory: () => Promise<VoteReceipt[]>;
  getReceiptByHash: (receiptHash: string) => Promise<VoteReceipt>;

  // Issue Reporting
  reportIssue: (electionId: string, issue: string, description: string) => Promise<void>;

  // Utility Functions
  clearError: () => void;
  clearCurrentSession: () => void;
  isSessionActive: boolean;
  isSessionExpired: boolean;
  sessionTimeRemaining: number;
  canVoteInElection: (electionId: string) => boolean;
}

export function useVoting(options: UseVotingOptions = {}): UseVotingReturn {
  const {
    electionId,
    autoStartSession = false,
    sessionTimeout = 30 * 60 * 1000, // 30 minutes
    enableAutoSave = true
  } = options;

  const { user, isAuthenticated, canVote } = useAuth();
  const { toast } = useNotificationStore();

  const {
    currentSession,
    currentBallot,
    votedElections,
    votingHistory,
    isVoting,
    isLoading,
    error,
    validationErrors,
    startSession: storeStartSession,
    updateBallot: storeUpdateBallot,
    validateCurrentBallot: storeValidateBallot,
    submitVote: storeSubmitVote,
    checkVotingStatus: storeCheckVotingStatus,
    fetchVotingHistory: storeFetchHistory,
    clearCurrentSession: storeClearSession,
    clearCurrentBallot: storeClearBallot,
    clearError: storeClearError,
    addVotedElection
  } = useVotingStore();

  // Local state for session management
  const [sessionExpireTime, setSessionExpireTime] = useState<Date | null>(null);
  const [autoSaveInterval, setAutoSaveInterval] = useState<NodeJS.Timeout | null>(null);

  // Auto-start session if electionId is provided
  useEffect(() => {
    if (autoStartSession && electionId && isAuthenticated && canVote) {
      startSession(electionId);
    }
  }, [autoStartSession, electionId, isAuthenticated, canVote]);

  // Session timeout management
  useEffect(() => {
    if (currentSession?.expiresAt) {
      setSessionExpireTime(new Date(currentSession.expiresAt));
    } else {
      setSessionExpireTime(null);
    }
  }, [currentSession]);

  // Auto-save ballot drafts
  useEffect(() => {
    if (enableAutoSave && currentBallot) {
      const interval = setInterval(() => {
        saveBallotDraft();
      }, 30000); // Save every 30 seconds

      setAutoSaveInterval(interval);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [enableAutoSave, currentBallot]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    };
  }, [autoSaveInterval]);

  // Session Management
  const startSession = useCallback(async (electionId: string): Promise<VotingSession> => {
    try {
      // Check if user has already voted
      const status = await storeCheckVotingStatus(electionId);
      if (status.hasVoted) {
        toast.warning('Already Voted', 'You have already voted in this election.');
        throw new Error('Already voted in this election');
      }

      const session = await storeStartSession(electionId);

      // Save session to local storage for recovery
      saveVotingSession({
        ...session,
        deviceFingerprint: generateVotingDeviceFingerprint()
      });

      toast.success('Voting Session Started', 'Your voting session has been initiated.');

      return session;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to start voting session';
      toast.error('Session Start Failed', message);
      throw error;
    }
  }, [storeStartSession, storeCheckVotingStatus, toast]);

  const endSession = useCallback(async (sessionId?: string): Promise<void> => {
    try {
      const id = sessionId || currentSession?.id;
      if (!id) {
        throw new Error('No active session to end');
      }

      await endVotingSession(id);

      // Clear local storage
      clearVotingSession();
      storeClearSession();
      storeClearBallot();

      toast.info('Session Ended', 'Your voting session has been ended.');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to end session';
      toast.error('End Session Failed', message);
      throw error;
    }
  }, [currentSession, storeClearSession, storeClearBallot, toast]);

  const extendSession = useCallback(async (sessionId?: string, minutes: number = 15): Promise<VotingSession> => {
    try {
      const id = sessionId || currentSession?.id;
      if (!id) {
        throw new Error('No active session to extend');
      }

      const response = await extendVotingSession(id);
      const extendedSession = response.data.data!;

      // Update store
      useVotingStore.setState({ currentSession: extendedSession });

      toast.success('Session Extended', `Session extended by ${minutes} minutes.`);

      return extendedSession;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to extend session';
      toast.error('Extend Session Failed', message);
      throw error;
    }
  }, [currentSession, toast]);

  const completeSession = useCallback(async (sessionId?: string): Promise<VotingSession> => {
    try {
      const id = sessionId || currentSession?.id;
      if (!id) {
        throw new Error('No active session to complete');
      }

      const response = await completeVotingSession(id);
      const completedSession = response.data.data!;

      // Clear local storage
      clearVotingSession();

      toast.success('Session Completed', 'Voting session completed successfully.');

      return completedSession;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to complete session';
      toast.error('Complete Session Failed', message);
      throw error;
    }
  }, [currentSession, toast]);

  const getSessionDetails = useCallback(async (sessionId: string): Promise<VotingSession> => {
    try {
      const response = await getVotingSession(sessionId);
      return response.data.data!;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to get session details';
      toast.error('Session Details Failed', message);
      throw error;
    }
  }, [toast]);

  // Ballot Management
  const getBallot = useCallback(async (electionId: string): Promise<ElectionBallot> => {
    try {
      const response = await getElectionBallot(electionId);
      return response.data.data!;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to get ballot';
      toast.error('Ballot Fetch Failed', message);
      throw error;
    }
  }, [toast]);

  const updateBallot = useCallback((votes: PositionVote[]) => {
    if (!currentSession) {
      toast.error('No Active Session', 'Please start a voting session first.');
      return;
    }

    storeUpdateBallot(currentSession.electionId, currentSession.id, votes);

    // Auto-save if enabled
    if (enableAutoSave) {
      saveBallotDraft();
    }
  }, [currentSession, storeUpdateBallot, enableAutoSave, toast]);

  const validateCurrentBallot = useCallback(async (): Promise<boolean> => {
    try {
      return await storeValidateBallot();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ballot validation failed';
      toast.error('Validation Failed', message);
      return false;
    }
  }, [storeValidateBallot, toast]);

  const clearBallot = useCallback(() => {
    storeClearBallot();
    clearVotingSession();
  }, [storeClearBallot]);

  const saveBallotDraft = useCallback(() => {
    if (currentBallot) {
      saveVotingSession({
        ...currentBallot,
        timestamp: new Date().toISOString()
      });
    }
  }, [currentBallot]);

  const loadBallotDraft = useCallback(() => {
    const savedSession = getSavedVotingSession();
    if (savedSession && isVotingSessionValid(savedSession)) {
      storeUpdateBallot(savedSession.electionId, savedSession.sessionId, savedSession.votes || []);
      toast.info('Draft Loaded', 'Your ballot draft has been restored.');
    }
  }, [storeUpdateBallot, toast]);

  // Voting Actions
  const submitVote = useCallback(async (): Promise<VoteReceipt> => {
    try {
      // Validate ballot before submission
      const isValid = await validateCurrentBallot();
      if (!isValid) {
        throw new Error('Ballot validation failed');
      }

      const receipt = await storeSubmitVote();

      // Clear saved session after successful vote
      clearVotingSession();

      toast.success('Vote Cast Successfully', 'Your vote has been recorded securely.');

      return receipt;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to submit vote';
      toast.error('Vote Submission Failed', message);
      throw error;
    }
  }, [storeSubmitVote, validateCurrentBallot, toast]);

  const verifyVoteReceipt = useCallback(async (verificationCode: string) => {
    try {
      const response = await verifyVote(verificationCode);
      return response.data.data!;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to verify vote';
      toast.error('Verification Failed', message);
      throw error;
    }
  }, [toast]);

  const getVoteVerificationStatus = useCallback(async (verificationCode: string) => {
    try {
      const response = await getVerificationStatus(verificationCode);
      return response.data.data!;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to get verification status';
      toast.error('Status Check Failed', message);
      throw error;
    }
  }, [toast]);

  // Voting Status
  const checkVotingStatus = useCallback(async (electionId: string) => {
    try {
      return await storeCheckVotingStatus(electionId);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to check voting status';
      toast.error('Status Check Failed', message);
      throw error;
    }
  }, [storeCheckVotingStatus, toast]);

  const hasVotedInElection = useCallback((electionId: string): boolean => {
    return votedElections.includes(electionId);
  }, [votedElections]);

  // History and Receipts
  const fetchVotingHistory = useCallback(async (): Promise<VoteReceipt[]> => {
    try {
      await storeFetchHistory();
      return votingHistory;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch voting history';
      toast.error('History Fetch Failed', message);
      throw error;
    }
  }, [storeFetchHistory, votingHistory, toast]);

  const getReceiptByHash = useCallback(async (receiptHash: string): Promise<VoteReceipt> => {
    try {
      const response = await getVoteReceipt(receiptHash);
      return response.data.data!;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to get receipt';
      toast.error('Receipt Fetch Failed', message);
      throw error;
    }
  }, [toast]);

  // Issue Reporting
  const reportIssue = useCallback(async (electionId: string, issue: string, description: string) => {
    try {
      await reportVotingIssue({
        electionId,
        sessionId: currentSession?.id,
        issue,
        description
      });
      toast.success('Issue Reported', 'Your issue has been reported to administrators.');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to report issue';
      toast.error('Report Failed', message);
      throw error;
    }
  }, [currentSession, toast]);

  // Utility Functions
  const clearError = useCallback(() => {
    storeClearError();
  }, [storeClearError]);

  const clearCurrentSession = useCallback(() => {
    storeClearSession();
    clearVotingSession();
  }, [storeClearSession]);

  // Computed Properties
  const isSessionActive = useMemo(() => {
    return currentSession?.status === 'ACTIVE';
  }, [currentSession]);

  const isSessionExpired = useMemo(() => {
    if (!sessionExpireTime) return false;
    return new Date() > sessionExpireTime;
  }, [sessionExpireTime]);

  const sessionTimeRemaining = useMemo(() => {
    if (!sessionExpireTime) return 0;
    const remaining = sessionExpireTime.getTime() - new Date().getTime();
    return Math.max(0, remaining);
  }, [sessionExpireTime]);

  const canVoteInElection = useCallback((electionId: string): boolean => {
    return canVote && !hasVotedInElection(electionId);
  }, [canVote, hasVotedInElection]);

  return {
    // State
    currentSession,
    currentBallot,
    votedElections,
    votingHistory,
    isVoting,
    isLoading,
    error,
    validationErrors,

    // Session Management
    startSession,
    endSession,
    extendSession,
    completeSession,
    getSessionDetails,

    // Ballot Management
    getBallot,
    updateBallot,
    validateCurrentBallot,
    clearBallot,
    saveBallotDraft,
    loadBallotDraft,

    // Voting Actions
    submitVote,
    verifyVoteReceipt,
    getVoteVerificationStatus,

    // Voting Status
    checkVotingStatus,
    hasVotedInElection,

    // History and Receipts
    fetchVotingHistory,
    getReceiptByHash,

    // Issue Reporting
    reportIssue,

    // Utility Functions
    clearError,
    clearCurrentSession,
    isSessionActive,
    isSessionExpired,
    sessionTimeRemaining,
    canVoteInElection
  };
}

export default useVoting;