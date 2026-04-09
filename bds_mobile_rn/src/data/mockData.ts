import type { Branch, TimeSlot } from '../types/models';

export function mockBranches(): Branch[] {
  return [
    {
      id: 1,
      name: 'BDS KL Sentral',
      crowdLevel: 'Low',
      distanceKm: 1.2,
      isAvailable: true,
      slotCapacity: 8,
      slotBooked: 5,
    },
    {
      id: 2,
      name: 'BDS Mid Valley',
      crowdLevel: 'High',
      distanceKm: 2.3,
      isAvailable: false,
      slotCapacity: 8,
      slotBooked: 8,
    },
    {
      id: 3,
      name: 'BDS Bangsar',
      crowdLevel: 'Moderate',
      distanceKm: 3.1,
      isAvailable: true,
      slotCapacity: 8,
      slotBooked: 8,
    },
    {
      id: 4,
      name: 'BDS Damansara',
      crowdLevel: 'Low',
      distanceKm: 5.4,
      isAvailable: true,
      slotCapacity: 10,
      slotBooked: 4,
    },
  ];
}

export function mockTimeSlots(): TimeSlot[] {
  return [
    { label: '09:00 - 09:30', capacity: 8, booked: 8 },
    { label: '09:30 - 10:00', capacity: 8, booked: 5 },
    { label: '10:00 - 10:30', capacity: 8, booked: 7 },
    { label: '10:30 - 11:00', capacity: 8, booked: 3 },
    { label: '11:00 - 11:30', capacity: 8, booked: 8 },
  ];
}
