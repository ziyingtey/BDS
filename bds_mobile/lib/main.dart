import 'package:flutter/material.dart';
import 'package:bds_mobile/features/auth/auth_screen.dart';

void main() {
  runApp(const BdsApp());
}

class BdsApp extends StatelessWidget {
  const BdsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'BDS Smart Branch',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      home: const AuthScreen(),
    );
  }
}
