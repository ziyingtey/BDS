import 'dart:async';

import 'package:bds_mobile/core/models/queue_ticket.dart';
import 'package:bds_mobile/core/state/user_session.dart';
import 'package:flutter/material.dart';

class QueueMonitoringScreen extends StatefulWidget {
  final QueueTicket ticket;

  const QueueMonitoringScreen({super.key, required this.ticket});

  @override
  State<QueueMonitoringScreen> createState() => _QueueMonitoringScreenState();
}

class _QueueMonitoringScreenState extends State<QueueMonitoringScreen> {
  late QueueTicket ticket;
  bool notificationsOn = true;
  bool autoReschedule = true;
  bool ticketCancelled = false;
  late Timer timer;
  int customersAhead = 6;
  int estimatedWaitMins = 24;

  String get currentlyServing {
    final current = int.parse(ticket.queueNumber.replaceFirst('Q-', ''));
    final serving = current - customersAhead;
    return 'Q-$serving';
  }

  @override
  void initState() {
    super.initState();
    ticket = widget.ticket;
    timer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted || ticketCancelled) return;
      setState(() {
        if (customersAhead > 0) {
          customersAhead--;
          estimatedWaitMins = (estimatedWaitMins - 3).clamp(3, 60);
        }
      });
    });
  }

  @override
  void dispose() {
    timer.cancel();
    super.dispose();
  }

  void _cancelTicket() {
    setState(() {
      ticketCancelled = true;
    });
    userSession.activeTicket = null;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Ticket cancelled.')),
    );
  }

  void _simulateMissedArrival() {
    if (autoReschedule) {
      setState(() {
        ticket = ticket.copyWith(slotLabel: 'Next available slot', queueNumber: 'Q-208');
        customersAhead = 5;
        estimatedWaitMins = 20;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Missed queue detected. Ticket auto-rescheduled.')),
      );
    } else {
      _cancelTicket();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Missed queue detected. Ticket cancelled.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Queue Monitoring'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Branch: ${ticket.branchName}'),
                    Text('Service: ${ticket.serviceName}'),
                    Text('Time slot: ${ticket.slotLabel}'),
                    Text('Your queue number: ${ticket.queueNumber}'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),
            Card(
              child: ListTile(
                title: const Text('Currently serving'),
                trailing: Text(
                  currentlyServing,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ),
            ),
            Card(
              child: ListTile(
                title: const Text('Customers ahead of you'),
                trailing: Text(
                  '$customersAhead',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ),
            ),
            Card(
              child: ListTile(
                title: const Text('Estimated waiting time'),
                trailing: Text(
                  '$estimatedWaitMins mins',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ),
            ),
            const SizedBox(height: 12),
            SwitchListTile(
              title: const Text('Push alert when queue is near'),
              subtitle: const Text('Module 4: smart notification toggle'),
              value: notificationsOn,
              onChanged: (value) {
                setState(() {
                  notificationsOn = value;
                });
              },
            ),
            SwitchListTile(
              title: const Text('Auto-reschedule if queue missed'),
              subtitle: const Text('Turn off to cancel ticket instead'),
              value: autoReschedule,
              onChanged: (value) {
                setState(() {
                  autoReschedule = value;
                });
              },
            ),
            const SizedBox(height: 8),
            FilledButton.tonal(
              onPressed: ticketCancelled ? null : _simulateMissedArrival,
              child: const Text('Simulate Missed Arrival'),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: ticketCancelled ? null : _cancelTicket,
              child: const Text('Cancel Ticket'),
            ),
            if (ticketCancelled) ...[
              const SizedBox(height: 8),
              const Text(
                'Status: Ticket cancelled',
                style: TextStyle(color: Colors.red, fontWeight: FontWeight.w700),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
