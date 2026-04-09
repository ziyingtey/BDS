import 'package:bds_mobile/core/data/mock_data.dart';
import 'package:bds_mobile/core/state/user_session.dart';
import 'package:bds_mobile/core/utils/iterable_extensions.dart';
import 'package:bds_mobile/features/branch/branch_discovery_screen.dart';
import 'package:bds_mobile/features/profile/profile_screen.dart';
import 'package:bds_mobile/features/queue/queue_monitoring_screen.dart';
import 'package:flutter/material.dart';

class CustomerHomeShell extends StatefulWidget {
  final String userName;

  const CustomerHomeShell({super.key, required this.userName});

  @override
  State<CustomerHomeShell> createState() => _CustomerHomeShellState();
}

class _CustomerHomeShellState extends State<CustomerHomeShell> {
  int tabIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('BDS Smart Branch'),
      ),
      body: IndexedStack(
        index: tabIndex,
        children: [
          _buildHomeTab(context),
          _buildMyTicketTab(context),
          _buildProfileTab(context),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tabIndex,
        onDestinationSelected: (index) {
          setState(() {
            tabIndex = index;
          });
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.confirmation_number_outlined), label: 'My Ticket'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }

  Widget _buildHomeTab(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: ListView(
        children: [
          Text('Welcome, ${widget.userName}', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          const Text('Discover branches, view smart recommendations, and reserve tickets.'),
          const SizedBox(height: 16),
          Card(
            child: ListTile(
              title: const Text('Branch Discovery'),
              subtitle: const Text('Location, branch wait times, and smart recommendation'),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
              onTap: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => BranchDiscoveryScreen(userName: widget.userName),
                  ),
                );
                setState(() {});
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMyTicketTab(BuildContext context) {
    final active = userSession.activeTicket;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: ListView(
        children: [
          Text('My Ticket', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          if (active == null)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(12),
                child: Text('No active queue ticket yet. Reserve one from Home > Branch Discovery.'),
              ),
            )
          else
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Queue: ${active.queueNumber}'),
                    Text('Branch: ${active.branchName}'),
                    Text('Service: ${active.serviceName}'),
                    Text('Slot: ${active.slotLabel}'),
                    const SizedBox(height: 8),
                    FilledButton.tonal(
                      onPressed: () async {
                        await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => QueueMonitoringScreen(ticket: active),
                          ),
                        );
                        setState(() {});
                      },
                      child: const Text('Open Queue Monitoring'),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildProfileTab(BuildContext context) {
    final preferredName = mockBranches()
        .where((b) => b.id == userSession.preferredBranchId)
        .map((b) => b.name)
        .firstOrNull;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: ListView(
        children: [
          Text('Profile', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text('Name: ${userSession.userName}'),
          Text('Preferred branch: ${preferredName ?? 'Not set'}'),
          const SizedBox(height: 12),
          FilledButton.tonal(
            onPressed: () async {
              await Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ProfileScreen()),
              );
              setState(() {});
            },
            child: const Text('Edit Profile'),
          ),
        ],
      ),
    );
  }
}
