import 'package:bds_mobile/core/data/auth_api.dart';
import 'package:bds_mobile/core/state/user_session.dart';
import 'package:bds_mobile/features/home/customer_home_shell.dart';
import 'package:flutter/material.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool isLogin = true;
  bool isLoading = false;
  String? errorText;
  String selectedRole = 'Customer';
  final TextEditingController nameController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final AuthApi authApi = AuthApi();

  @override
  void dispose() {
    nameController.dispose();
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  Future<void> _continue() async {
    setState(() {
      isLoading = true;
      errorText = null;
    });
    final email = emailController.text.trim();
    final password = passwordController.text.trim();
    final name = nameController.text.trim().isEmpty
        ? 'Guest User'
        : nameController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      setState(() {
        isLoading = false;
        errorText = 'Email and password are required.';
      });
      return;
    }

    if (!isLogin && password.length < 8) {
      setState(() {
        isLoading = false;
        errorText = 'Password must be at least 8 characters (same as server rule).';
      });
      return;
    }

    try {
      if (isLogin) {
        final response = await authApi.login(email: email, password: password);
        final user = response['user'] as Map<String, dynamic>;
        userSession.userId = user['id'] as int?;
        userSession.userName = user['fullName'] as String? ?? 'Guest User';
        userSession.email = user['email'] as String?;
        userSession.role = user['role'] as String?;
        userSession.token = response['token'] as String?;
      } else {
        await authApi.register(
          fullName: name,
          email: email,
          password: password,
          role: selectedRole,
        );
        final response = await authApi.login(email: email, password: password);
        final user = response['user'] as Map<String, dynamic>;
        userSession.userId = user['id'] as int?;
        userSession.userName = user['fullName'] as String? ?? name;
        userSession.email = user['email'] as String?;
        userSession.role = user['role'] as String?;
        userSession.token = response['token'] as String?;
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        isLoading = false;
        errorText = e.toString().replaceFirst('Exception: ', '');
      });
      return;
    }

    userSession.userName = nameController.text.trim().isEmpty
        ? userSession.userName
        : nameController.text.trim();
    if (!mounted) return;
    setState(() => isLoading = false);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CustomerHomeShell(userName: userSession.userName),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: ListView(
            children: [
              const SizedBox(height: 24),
              Text(
                'BDS Smart Branch App',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              const Text(
                'Requires bds_backend on HTTP port 5062 (match launchSettings; API_BASE_URL on real device)',
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 28),
              SegmentedButton<bool>(
                segments: const [
                  ButtonSegment<bool>(value: true, label: Text('Login')),
                  ButtonSegment<bool>(value: false, label: Text('Register')),
                ],
                selected: {isLogin},
                onSelectionChanged: (selection) {
                  setState(() {
                    isLogin = selection.first;
                  });
                },
              ),
              const SizedBox(height: 20),
              if (!isLogin)
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(
                    labelText: 'Full Name',
                    border: OutlineInputBorder(),
                  ),
                ),
              if (!isLogin) const SizedBox(height: 12),
              if (!isLogin)
                DropdownButtonFormField<String>(
                  initialValue: selectedRole,
                  decoration: const InputDecoration(
                    labelText: 'Role',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'Customer', child: Text('Customer')),
                    DropdownMenuItem(value: 'Staff', child: Text('Staff')),
                  ],
                  onChanged: (value) {
                    if (value == null) return;
                    setState(() {
                      selectedRole = value;
                    });
                  },
                ),
              if (!isLogin) const SizedBox(height: 12),
              TextField(
                controller: emailController,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: passwordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Password',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 20),
              if (errorText != null) ...[
                Text(errorText!, style: const TextStyle(color: Colors.red)),
                const SizedBox(height: 10),
              ],
              FilledButton(
                onPressed: isLoading ? null : _continue,
                child: Text(isLoading
                    ? 'Please wait...'
                    : (isLogin ? 'Login' : 'Create Account')),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
