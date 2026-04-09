import 'package:bds_mobile/core/data/mock_data.dart';
import 'package:bds_mobile/core/models/branch.dart';
import 'package:bds_mobile/features/booking/slot_booking_screen.dart';
import 'package:bds_mobile/features/profile/profile_screen.dart';
import 'package:flutter/material.dart';

class BranchDiscoveryScreen extends StatefulWidget {
  final String userName;

  const BranchDiscoveryScreen({super.key, required this.userName});

  @override
  State<BranchDiscoveryScreen> createState() => _BranchDiscoveryScreenState();
}

class _BranchDiscoveryScreenState extends State<BranchDiscoveryScreen> {
  final List<Branch> branches = mockBranches();

  @override
  Widget build(BuildContext context) {
    const currentArea = 'Near Mid Valley';
    final candidates = branches
        .where((b) => b.isAvailable && !b.isOvercrowded && !b.allSlotsFull)
        .toList();
    final recommended = candidates.isNotEmpty
        ? candidates.reduce((a, b) => a.waitMins <= b.waitMins ? a : b)
        : branches.first;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Discover Branches'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: () async {
              await Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ProfileScreen()),
              );
              setState(() {});
            },
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [
            Text('Hi, ${widget.userName}', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            const Text('Detected location (mock):'),
            const SizedBox(height: 4),
            const Chip(
              label: Text(currentArea),
              avatar: Icon(Icons.my_location, size: 18),
            ),
            const SizedBox(height: 16),
            Card(
              child: ListTile(
                title: const Text('Smart Branch Recommendation'),
                subtitle: Text(
                  '${recommended.name} • ${recommended.distanceKm.toStringAsFixed(1)} km • ~${recommended.waitMins} mins',
                ),
                trailing: const Icon(Icons.star, color: Colors.amber),
              ),
            ),
            const SizedBox(height: 12),
            Text('All Branches', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            ...branches.map(
              (branch) => Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              branch.name,
                              style: Theme.of(context).textTheme.titleSmall,
                            ),
                          ),
                          _statusBadge(branch),
                        ],
                      ),
                      Text(
                        '${branch.distanceKm.toStringAsFixed(1)} km away • Estimated wait ${branch.waitMins} mins',
                      ),
                      const SizedBox(height: 8),
                      FilledButton.tonal(
                        onPressed: !branch.isAvailable || branch.isOvercrowded || branch.allSlotsFull
                            ? null
                            : () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => SlotBookingScreen(branch: branch),
                                  ),
                                );
                              },
                        child: Text(
                          !branch.isAvailable || branch.isOvercrowded
                              ? 'Temporarily Unavailable'
                              : (branch.allSlotsFull ? 'All Slots Full' : 'Reserve Queue Ticket'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusBadge(Branch branch) {
    if (!branch.isAvailable || branch.isOvercrowded) {
      return const Chip(
        label: Text('Overcrowded'),
        backgroundColor: Color(0xFFFFE0E0),
      );
    }
    if (branch.allSlotsFull) {
      return const Chip(
        label: Text('Slots Full'),
        backgroundColor: Color(0xFFFFF3CD),
      );
    }
    return const Chip(
      label: Text('Available'),
      backgroundColor: Color(0xFFDFF5E3),
    );
  }
}
