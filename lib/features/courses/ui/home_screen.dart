import 'package:flutter/material.dart';

import '../controllers/course_list_controller.dart';
import '../repositories/course_repository.dart';
import 'widgets/course_card.dart';
import 'widgets/state_views.dart';

/// Course list screen.
///
/// Owns its [CourseListController] unless one is injected (dependency
/// injection keeps widget tests hermetic). Every possible state — loading,
/// success, empty, error — has dedicated, user-friendly visuals.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, this.controller});

  final CourseListController? controller;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final CourseListController _controller;
  HttpCourseRepository? _ownedRepository;

  @override
  void initState() {
    super.initState();
    final injected = widget.controller;
    if (injected != null) {
      _controller = injected;
    } else {
      final repository = HttpCourseRepository();
      _ownedRepository = repository;
      _controller = CourseListController(repository: repository);
    }
    if (_controller.status == CourseListStatus.idle) {
      _controller.load();
    }
  }

  @override
  void dispose() {
    if (widget.controller == null) {
      _controller.dispose();
      _ownedRepository?.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('App Mobile Collège'),
        actions: [
          ListenableBuilder(
            listenable: _controller,
            builder: (context, _) => IconButton(
              icon: const Icon(Icons.refresh),
              tooltip: 'Actualiser',
              onPressed: _controller.status == CourseListStatus.loading
                  ? null
                  : () => _controller.load(),
            ),
          ),
        ],
      ),
      body: ListenableBuilder(
        listenable: _controller,
        builder: (context, _) => RefreshIndicator(
          onRefresh: () => _controller.load(),
          child: _buildBodyForStatus(),
        ),
      ),
    );
  }

  Widget _buildBodyForStatus() {
    return switch (_controller.status) {
      CourseListStatus.idle || CourseListStatus.loading => const LoadingView(),
      CourseListStatus.error => ErrorView(
          message: _controller.errorMessage,
          onRetry: () => _controller.load(),
        ),
      CourseListStatus.success => _controller.isEmpty
          ? EmptyView(onRefresh: () => _controller.load())
          : _buildCourseGrid(),
    };
  }

  /// Responsive grid: one column on narrow phones, several on tablets —
  /// `GridView.extent` derives the column count from the available width.
  Widget _buildCourseGrid() {
    final courses = _controller.courses;
    final lastUpdated = _controller.lastUpdated;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Text(
            '${courses.length} cours'
            '${lastUpdated != null ? ' · Actualisé à ${_formatTime(lastUpdated)}' : ''}',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
        Expanded(
          child: GridView.extent(
            maxCrossAxisExtent: 480,
            mainAxisExtent: 160,
            padding: const EdgeInsets.all(16),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              for (final course in courses) CourseCard(course: course),
            ],
          ),
        ),
      ],
    );
  }

  String _formatTime(DateTime dateTime) =>
      TimeOfDay.fromDateTime(dateTime).format(context);
}
