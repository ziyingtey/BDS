import { getBackendBaseUrl } from '../config/apiBaseUrl';

export type PredictWaitParams = {
  branchId: number;
  dayOfWeek: number;
  hourOfDay: number;
  month: number;
  serviceType: string;
  queueLength: number;
  countersOpen: number;
};

export type PredictWaitResult = {
  waitMinutes: number;
  source: string;
};

/**
 * Calls bds_backend POST /api/wait-time/predict → Python sklearn or C# fallback.
 */
export async function predictWait(params: PredictWaitParams): Promise<PredictWaitResult> {
  const base = getBackendBaseUrl();
  const res = await fetch(`${base}/api/wait-time/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      branchId: params.branchId,
      dayOfWeek: params.dayOfWeek,
      hourOfDay: params.hourOfDay,
      month: params.month,
      serviceType: params.serviceType,
      queueLength: params.queueLength,
      countersOpen: params.countersOpen,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Wait predict failed (${res.status})`);
  }
  const data = (await res.json()) as PredictWaitResult;
  return data;
}
