import { useState, useCallback } from 'react';
import {
  AnalysisResult,
  EventsResponse,
  GoalForecast,
  HistoryResponse,
  LoadingState,
  ProductivityPatterns,
} from '../types';
import {
  fetchAnalysis,
  fetchEvents,
  fetchForecast,
  fetchHistory,
  fetchPatterns,
  getExportUrl,
} from '../api/analyzeApi';

export interface UseAnalyticsReturn {
  data: AnalysisResult | null;
  loadingState: LoadingState;
  error: string | null;
  history: HistoryResponse | null;
  events: EventsResponse | null;
  patterns: ProductivityPatterns | null;
  forecast: GoalForecast | null;
  analyticsLoading: boolean;
  exportUrl: string | null;
  analyze: (input: string) => Promise<void>;
  reset: () => void;
  clearError: () => void;
}

function parseError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { data?: { error?: string }; status?: number } };
    const status = axiosErr.response?.status;
    const msg = axiosErr.response?.data?.error;
    if (status === 404) return 'User not found. Check the username and try again.';
    if (status === 403) return 'This profile is private and cannot be analyzed.';
    if (status === 503) return 'LeetCode API is temporarily unavailable. Try again in a moment.';
    if (status === 400) return msg || 'Invalid username format.';
    if (msg) return msg;
  }
  if (err instanceof Error) {
    if (err.message.includes('Network Error') || err.message.includes('ECONNREFUSED')) {
      return 'Cannot reach the server. Make sure the backend is running.';
    }
    if (err.message.includes('timeout')) {
      return 'Request timed out. LeetCode may be slow — try again.';
    }
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}

export function useAnalytics(): UseAnalyticsReturn {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [events, setEvents] = useState<EventsResponse | null>(null);
  const [patterns, setPatterns] = useState<ProductivityPatterns | null>(null);
  const [forecast, setForecast] = useState<GoalForecast | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  const analyze = useCallback(async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError('Please enter a username.');
      return;
    }

    setLoadingState('loading');
    setError(null);
    setData(null);
    setHistory(null);
    setEvents(null);
    setPatterns(null);
    setForecast(null);
    setExportUrl(null);

    try {
      const result = await fetchAnalysis(trimmed);
      setData(result);
      setAnalyticsLoading(true);

      const username = result.username || trimmed;
      const [historyRes, eventsRes, patternsRes, forecastRes] = await Promise.all([
        fetchHistory(username, 60),
        fetchEvents(username, 120),
        fetchPatterns(username),
        fetchForecast(username, 500),
      ]);

      setHistory(historyRes);
      setEvents(eventsRes);
      setPatterns(patternsRes);
      setForecast(forecastRes);
      setExportUrl(getExportUrl(username));
      setLoadingState('success');
    } catch (err) {
      setError(parseError(err));
      setLoadingState('error');
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setLoadingState('idle');
    setError(null);
    setHistory(null);
    setEvents(null);
    setPatterns(null);
    setForecast(null);
    setAnalyticsLoading(false);
    setExportUrl(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    data,
    loadingState,
    error,
    history,
    events,
    patterns,
    forecast,
    analyticsLoading,
    exportUrl,
    analyze,
    reset,
    clearError,
  };
}
