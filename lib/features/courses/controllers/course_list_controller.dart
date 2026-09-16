import 'package:flutter/foundation.dart';

import '../models/course.dart';
import '../repositories/course_repository.dart';

/// Lifecycle of a course-list fetch, driving the UI state machine:
/// idle → loading → success | error.
enum CourseListStatus { idle, loading, success, error }

/// State holder for the course list screen.
///
/// A [ChangeNotifier] keeps the dependency footprint at zero while remaining
/// trivially testable; widgets subscribe through `ListenableBuilder`.
class CourseListController extends ChangeNotifier {
  CourseListController({required this.repository});

  final CourseRepository repository;

  CourseListStatus _status = CourseListStatus.idle;
  List<Course> _courses = const [];
  String _errorMessage = '';
  DateTime? _lastUpdated;
  bool _disposed = false;
  int _requestGeneration = 0;

  CourseListStatus get status => _status;

  List<Course> get courses => _courses;

  String get errorMessage => _errorMessage;

  DateTime? get lastUpdated => _lastUpdated;

  bool get isEmpty => _courses.isEmpty;

  /// Loads (or reloads) the course list. Safe to call concurrently: only the
  /// most recent request can mutate the state.
  Future<void> load() async {
    final generation = ++_requestGeneration;
    _status = CourseListStatus.loading;
    _notify();

    try {
      final courses = await repository.fetchCourses();
      if (_isStale(generation)) return;
      _courses = List.unmodifiable(courses);
      _lastUpdated = DateTime.now();
      _status = CourseListStatus.success;
    } on ApiException catch (error) {
      if (_isStale(generation)) return;
      _errorMessage = error.userFriendlyMessage;
      _status = CourseListStatus.error;
    } on Exception {
      if (_isStale(generation)) return;
      _errorMessage = 'Une erreur inattendue est survenue.';
      _status = CourseListStatus.error;
    }
    _notify();
  }

  bool _isStale(int generation) => _disposed || generation != _requestGeneration;

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }
}
