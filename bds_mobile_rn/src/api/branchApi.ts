import { getBackendBaseUrl } from '../config/apiBaseUrl';

export type BranchListItem = {
  id: number;
  name: string;
  distanceKm: number;
  crowdLevel: string;
  slotCapacity: number;
  slotBooked: number;
  waitingCount: number;
  bookingDisabled: boolean;
  hasAvailableSlot: boolean;
  isOvercrowded: boolean;
  canBook: boolean;
  estimatedWaitMinutes: number;
  estimateSource: string;
};

export type BranchTimeSlotRow = {
  label: string;
  capacity: number;
  booked: number;
};

export async function fetchBranches(): Promise<BranchListItem[]> {
  const base = getBackendBaseUrl();
  const res = await fetch(`${base}/api/branches`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Branches failed (${res.status})`);
  }
  return (await res.json()) as BranchListItem[];
}

export async function fetchBranchSlots(branchId: number): Promise<BranchTimeSlotRow[]> {
  const base = getBackendBaseUrl();
  const res = await fetch(`${base}/api/branches/${branchId}/slots`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Slots failed (${res.status})`);
  }
  return (await res.json()) as BranchTimeSlotRow[];
}
