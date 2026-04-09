export type Branch = {
  id: number;
  name: string;
  crowdLevel: 'Low' | 'Moderate' | 'High';
  distanceKm: number;
  isAvailable: boolean;
  slotCapacity: number;
  slotBooked: number;
};

export type TimeSlot = {
  label: string;
  capacity: number;
  booked: number;
};

export type QueueTicket = {
  branchName: string;
  serviceName: string;
  slotLabel: string;
  queueNumber: string;
};

export function branchWaitMins(b: Branch): number {
  const base = b.crowdLevel === 'High' ? 32 : b.crowdLevel === 'Moderate' ? 18 : 10;
  const slotPressure = Math.round((b.slotBooked / b.slotCapacity) * 12);
  return base + slotPressure;
}

export function isOvercrowded(b: Branch): boolean {
  return b.crowdLevel === 'High';
}

export function allSlotsFull(b: Branch): boolean {
  return b.slotBooked >= b.slotCapacity;
}
