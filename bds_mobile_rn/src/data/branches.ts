/** Static branch pins for map + local nearest-branch fallback. Replace with real Public Bank coordinates as needed. */
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
