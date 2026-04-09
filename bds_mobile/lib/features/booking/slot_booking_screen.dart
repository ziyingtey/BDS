import 'package:bds_mobile/core/data/mock_data.dart';
import 'package:bds_mobile/core/models/branch.dart';
import 'package:bds_mobile/core/models/queue_ticket.dart';
import 'package:bds_mobile/core/models/time_slot.dart';
import 'package:bds_mobile/core/state/user_session.dart';
import 'package:bds_mobile/features/queue/queue_monitoring_screen.dart';
import 'package:flutter/material.dart';

class SlotBookingScreen extends StatefulWidget {
  final Branch branch;

  const SlotBookingScreen({super.key, required this.branch});

  @override
  State<SlotBookingScreen> createState() => _SlotBookingScreenState();
}

class _SlotBookingScreenState extends State<SlotBookingScreen> {
  final services = const ['General Banking', 'Card Services', 'Wealth Management'];
  String selectedService = 'General Banking';
  String? selectedSlot;

  late final List<TimeSlot> slots;

  @override
  void initState() {
    super.initState();
    slots = mockTimeSlots();
  }

  @override
  Widget build(BuildContext context) {
    final availableSlots = slots.where((s) => s.booked < s.capacity).length;

    return Scaffold(
      appBar: AppBar(title: Text(widget.branch.name)),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [
            Text('Reserve Queue Ticket', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: selectedService,
              decoration: const InputDecoration(
                labelText: 'Select Service',
                border: OutlineInputBorder(),
              ),
              items: services
                  .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                  .toList(),
              onChanged: (value) {
                if (value == null) return;
                setState(() {
                  selectedService = value;
                });
              },
            ),
            const SizedBox(height: 16),
            Text(
              'Available slots: $availableSlots/${slots.length}',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            ...slots.map((slot) {
              final isFull = slot.booked >= slot.capacity;
              final isSelected = selectedSlot == slot.label;
              return Card(
                child: ListTile(
                  enabled: !isFull,
                  title: Text(slot.label),
                  subtitle: Text('Capacity ${slot.booked}/${slot.capacity}'),
                  trailing: isFull
                      ? const Chip(label: Text('Full'))
                      : ChoiceChip(
                          label: const Text('Select'),
                          selected: isSelected,
                          onSelected: (_) {
                            setState(() {
                              selectedSlot = slot.label;
                            });
                          },
                        ),
                ),
              );
            }),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: selectedSlot == null
                  ? null
                  : () {
                      final queueNumber = 'Q-${DateTime.now().millisecond % 200 + 101}';
                      userSession.activeTicket = QueueTicket(
                        branchName: widget.branch.name,
                        serviceName: selectedService,
                        slotLabel: selectedSlot!,
                        queueNumber: queueNumber,
                      );
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => QueueMonitoringScreen(
                            ticket: userSession.activeTicket!,
                          ),
                        ),
                      );
                    },
              child: const Text('Confirm Reservation'),
            ),
          ],
        ),
      ),
    );
  }
}
