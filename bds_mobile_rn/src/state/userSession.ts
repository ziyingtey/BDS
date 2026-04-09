import type { QueueTicket } from '../types/models';

export const userSession = {
  userId: null as number | null,
  userName: 'Guest User',
  email: null as string | null,
  role: null as string | null,
  token: null as string | null,
  preferredBranchId: null as number | null,
  activeTicket: null as QueueTicket | null,
};
