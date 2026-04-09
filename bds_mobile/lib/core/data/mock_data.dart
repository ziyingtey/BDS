import 'package:bds_mobile/core/models/branch.dart';
import 'package:bds_mobile/core/models/time_slot.dart';

List<Branch> mockBranches() {
  return const [
    Branch(
      id: 1,
      name: 'BDS KL Sentral',
      crowdLevel: 'Low',
      distanceKm: 1.2,
      isAvailable: true,
      slotCapacity: 8,
      slotBooked: 5,
    ),
    Branch(
      id: 2,
      name: 'BDS Mid Valley',
      crowdLevel: 'High',
      distanceKm: 2.3,
      isAvailable: false,
      slotCapacity: 8,
      slotBooked: 8,
    ),
    Branch(
      id: 3,
      name: 'BDS Bangsar',
      crowdLevel: 'Moderate',
      distanceKm: 3.1,
      isAvailable: true,
      slotCapacity: 8,
      slotBooked: 8,
    ),
    Branch(
      id: 4,
      name: 'BDS Damansara',
      crowdLevel: 'Low',
      distanceKm: 5.4,
      isAvailable: true,
      slotCapacity: 10,
      slotBooked: 4,
    ),
  ];
}

List<TimeSlot> mockTimeSlots() {
  return const [
    TimeSlot(label: '09:00 - 09:30', capacity: 8, booked: 8),
    TimeSlot(label: '09:30 - 10:00', capacity: 8, booked: 5),
    TimeSlot(label: '10:00 - 10:30', capacity: 8, booked: 7),
    TimeSlot(label: '10:30 - 11:00', capacity: 8, booked: 3),
    TimeSlot(label: '11:00 - 11:30', capacity: 8, booked: 8),
  ];
}
