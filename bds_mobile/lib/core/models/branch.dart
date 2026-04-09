class Branch {
  final int id;
  final String name;
  final String crowdLevel;
  final double distanceKm;
  final bool isAvailable;
  final int slotCapacity;
  final int slotBooked;

  const Branch({
    required this.id,
    required this.name,
    required this.crowdLevel,
    required this.distanceKm,
    required this.isAvailable,
    required this.slotCapacity,
    required this.slotBooked,
  });

  int get waitMins {
    final base = crowdLevel == 'High' ? 32 : (crowdLevel == 'Moderate' ? 18 : 10);
    final slotPressure = ((slotBooked / slotCapacity) * 12).round();
    return base + slotPressure;
  }

  bool get isOvercrowded => crowdLevel == 'High';
  bool get allSlotsFull => slotBooked >= slotCapacity;
}
