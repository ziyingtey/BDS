import 'package:bds_mobile/core/data/auth_api.dart';
import 'package:bds_mobile/core/data/mock_data.dart';
import 'package:bds_mobile/core/state/user_session.dart';
import 'package:flutter/material.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late final TextEditingController nameController;
  final AuthApi authApi = AuthApi();
  bool isDeleting = false;

  @override
  void initState() {
    super.initState();
    nameController = TextEditingController(text: userSession.userName);
  }

  @override
  void dispose() {
    nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final branches = mockBranches();
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(
                labelText: 'Display Name',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            Text('Email: ${userSession.email ?? '-'}'),
            Text('Role: ${userSession.role ?? '-'}'),
            const SizedBox(height: 12),
            DropdownButtonFormField<int>(
              initialValue: userSession.preferredBranchId,
              decoration: const InputDecoration(
                labelText: 'Preferred Branch',
                border: OutlineInputBorder(),
              ),
              items: branches
                  .map(
                    (branch) => DropdownMenuItem<int>(
                      value: branch.id,
                      child: Text(branch.name),
                    ),
                  )
                  .toList(),
              onChanged: (value) {
                setState(() {
                  userSession.preferredBranchId = value;
                });
              },
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: () {
                userSession.userName = nameController.text.trim().isEmpty
                    ? 'Guest User'
                    : nameController.text.trim();
                Navigator.pop(context);
              },
              child: const Text('Save Profile'),
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: isDeleting ? null : _confirmDeleteAccount,
              style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
              child: Text(isDeleting ? 'Deleting...' : 'Delete Account'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmDeleteAccount() async {
    final passwordController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Account'),
        content: TextField(
          controller: passwordController,
          obscureText: true,
          decoration: const InputDecoration(
            labelText: 'Confirm password',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    if (!mounted) return;
    if ((userSession.token ?? '').isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please login first.')),
      );
      return;
    }
    setState(() => isDeleting = true);
    try {
      await authApi.deleteAccount(
        token: userSession.token!,
        password: passwordController.text.trim(),
      );
      userSession.userId = null;
      userSession.token = null;
      userSession.email = null;
      userSession.role = null;
      userSession.activeTicket = null;
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Account deleted successfully.')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      if (mounted) setState(() => isDeleting = false);
    }
  }
}
