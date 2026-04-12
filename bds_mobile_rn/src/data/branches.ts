/**
 * Fallback pins if the API is offline. The map prefers GET /api/branches coordinates when available.
 * Import a full directory from the official PBE branch locator (manual / admin), not by scraping.
 */
export type BranchPin = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
};

export const branchPins: BranchPin[] = [
  { id: 1, name: 'PBB Pasir Gudang', latitude: 1.4721, longitude: 103.899 },
  { id: 2, name: 'PBB Johor Bahru', latitude: 1.4927, longitude: 103.7414 },
  { id: 3, name: 'PBB Permas Jaya', latitude: 1.4918, longitude: 103.8156 },
];
