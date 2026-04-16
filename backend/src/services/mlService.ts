/**
 * mlService.ts
 *
 * Thin client for the Python FastAPI ML prediction microservice.
 * Calls POST /predict and returns a typed prediction payload.
 * Fails gracefully — if the ML service is unavailable the caller
 * receives null and can fall back to rule-based predictions.
 */

import axios, { AxiosError } from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_TIMEOUT_MS  = Number(process.env.ML_TIMEOUT_MS) || 5000;

// ── Request / Response types (mirror Python Pydantic models) ─────────────────

export interface MLPredictRequest {
  avgProblemsPerDay: number;
  consistencyScore:  number;
  growthRate:        number;
  weakTopicsCount:   number;
}

export type RiskLevel      = 'low' | 'medium' | 'high';
export type DeclineSeverity = 'none' | 'mild' | 'moderate' | 'severe';

export interface MLPredictResponse {
  streakRisk:               RiskLevel;
  riskScore:                number;
  predictedSolvesNextWeek:  number;
  predictedSolvesNextMonth: number;
  confidence:               number;
  performanceDecline:       boolean;
  declineSeverity:          DeclineSeverity;
  message:                  string;
  details: {
    streakRiskModel:   Record<string, number>;
    growthModel:       Record<string, number>;
    confidenceModel:   Record<string, number>;
    declineDetector:   Record<string, unknown>;
  };
}

// ── Client ────────────────────────────────────────────────────────────────────

const mlClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: ML_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Call the ML prediction service.
 *
 * Returns null (and logs a warning) if the service is unreachable or
 * returns an error — the caller should fall back to rule-based logic.
 */
export async function getMLPrediction(
  input: MLPredictRequest,
): Promise<MLPredictResponse | null> {
  try {
    const { data } = await mlClient.post<MLPredictResponse>('/predict', input);
    return data;
  } catch (err) {
    const axiosErr = err as AxiosError;
    if (axiosErr.code === 'ECONNREFUSED' || axiosErr.code === 'ENOTFOUND') {
      console.warn('[mlService] ML service unreachable — skipping ML prediction.');
    } else if (axiosErr.response) {
      console.warn(
        `[mlService] ML service returned ${axiosErr.response.status}:`,
        axiosErr.response.data,
      );
    } else {
      console.warn('[mlService] ML prediction failed:', axiosErr.message);
    }
    return null;
  }
}

/**
 * Check if the ML service is healthy.
 * Useful for startup diagnostics or a /health endpoint.
 */
export async function checkMLHealth(): Promise<boolean> {
  try {
    const { data } = await mlClient.get<{ status: string }>('/health', { timeout: 2000 });
    return data.status === 'ok';
  } catch {
    return false;
  }
}
