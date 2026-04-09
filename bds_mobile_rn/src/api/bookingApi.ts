import { getBackendBaseUrl } from '../config/apiBaseUrl';

export type CreateBookingPayload = {
  branchId: number;
  serviceType: string;
  timeSlotLabel: string;
};

export type CreateBookingResult = {
  ticketId: number;
  branchId: number;
  branchName: string;
  serviceType: string;
  timeSlotLabel: string;
  queueLabel: string;
  queueNumber: number;
};

export type TicketStatus = {
  ticketId: number;
  branchId: number;
  branchName: string;
  serviceType: string;
  timeSlotLabel: string;
  queueLabel: string;
  queueNumber: number;
  nowServingNumber: number;
  nowServingLabel: string;
  customersAhead: number;
  estimatedWaitMinutes: number;
  estimateSource: string;
  status: string;
};

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  } as const;
}

export async function createBooking(
  token: string,
  payload: CreateBookingPayload
): Promise<CreateBookingResult> {
  const base = getBackendBaseUrl();
  const res = await fetch(`${base}/api/bookings`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      branchId: payload.branchId,
      serviceType: payload.serviceType,
      timeSlotLabel: payload.timeSlotLabel,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Booking failed (${res.status})`);
  }
  return (await res.json()) as CreateBookingResult;
}

export async function fetchTicketStatus(token: string, ticketId: number): Promise<TicketStatus> {
  const base = getBackendBaseUrl();
  const res = await fetch(`${base}/api/bookings/${ticketId}/status`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Status failed (${res.status})`);
  }
  return (await res.json()) as TicketStatus;
}

export async function cancelBooking(token: string, ticketId: number): Promise<void> {
  const base = getBackendBaseUrl();
  const res = await fetch(`${base}/api/bookings/${ticketId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Cancel failed (${res.status})`);
  }
}
