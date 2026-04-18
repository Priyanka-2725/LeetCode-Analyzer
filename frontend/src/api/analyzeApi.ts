import axios from 'axios';
import {
  AnalysisResult,
  ComparisonResponse,
  EventsResponse,
  GoalForecast,
  HistoryResponse,
  ProductivityPatterns,
  SimulationCurrentStats,
  SimulationInput,
  SimulationResponse,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

export async function fetchAnalysis(usernameOrUrl: string): Promise<AnalysisResult> {
  const { data } = await api.post<AnalysisResult>('/api/analyze', {
    username: usernameOrUrl,
  });
  return data;
}

export async function fetchHistory(username: string, days = 30): Promise<HistoryResponse> {
  const { data } = await api.get<HistoryResponse>(`/api/history/${encodeURIComponent(username)}`, {
    params: { days },
  });
  return data;
}

export async function fetchEvents(username: string, limit = 100): Promise<EventsResponse> {
  const { data } = await api.get<EventsResponse>(`/api/events/${encodeURIComponent(username)}`, {
    params: { limit },
  });
  return data;
}

export async function fetchPatterns(username: string): Promise<ProductivityPatterns> {
  const { data } = await api.get<ProductivityPatterns>(`/api/patterns/${encodeURIComponent(username)}`);
  return data;
}

export async function fetchForecast(username: string, target = 500): Promise<GoalForecast> {
  const { data } = await api.get<GoalForecast>(`/api/forecast/${encodeURIComponent(username)}`, {
    params: { target },
  });
  return data;
}

export function getExportUrl(username: string): string {
  return `${BASE_URL}/api/export/${encodeURIComponent(username)}`;
}

export async function fetchComparison(usernameA: string, usernameB: string): Promise<ComparisonResponse> {
  const { data } = await api.post<ComparisonResponse>('/api/compare', {
    usernameA,
    usernameB,
  });
  return data;
}

export async function fetchSimulation(
  currentStats: SimulationCurrentStats,
  simulationInput: SimulationInput,
): Promise<SimulationResponse> {
  const { data } = await api.post<SimulationResponse>('/api/simulate', {
    currentStats,
    simulationInput,
  });
  return data;
}
