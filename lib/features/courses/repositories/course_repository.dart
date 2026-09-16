import '../../../core/api_client.dart';
import '../../../core/api_config.dart';
import '../../../core/api_exception.dart';
import '../models/course.dart';

/// Data-source abstraction: the UI/state layer only depends on this
/// interface, which keeps widget tests hermetic (no network needed).
abstract interface class CourseRepository {
  Future<List<Course>> fetchCourses();
}

/// Production implementation backed by the Express API.
class HttpCourseRepository implements CourseRepository {
  HttpCourseRepository({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  @override
  Future<List<Course>> fetchCourses() async {
    final dynamic payload = await _client.getJson(ApiConfig.coursesPath);
    return _extractCourseItems(payload)
        .whereType<Map<String, dynamic>>()
        .map(Course.fromJson)
        .toList(growable: false);
  }

  void dispose() => _client.dispose();

  /// Accepts both `{ "count": n, "data": [...] }` and a bare `[...]`.
  static Iterable<dynamic> _extractCourseItems(dynamic payload) {
    if (payload is List) return payload;
    if (payload is Map<String, dynamic>) {
      final dynamic data = payload['data'];
      if (data is List) return data;
    }
    throw const ApiException(ApiExceptionReason.badResponse);
  }
}
