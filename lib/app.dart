import 'package:flutter/material.dart';

import 'features/courses/ui/home_screen.dart';
import 'theme/app_theme.dart';

/// Root widget: global theming and navigation entry point.
class CollegeApp extends StatelessWidget {
  const CollegeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'App Mobile Collège',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      home: const HomeScreen(),
    );
  }
}
