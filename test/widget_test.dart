// Hermetic widget tests: the repository is faked, so no network access is
// needed and every application state (loading, success, empty, error) is
// exercised deterministically.

import 'package:app_mobile_college/core/api_exception.dart';
import 'package:app_mobile_college/features/courses/controllers/course_list_controller.dart';
import 'package:app_mobile_college/features/courses/models/course.dart';
import 'package:app_mobile_college/features/courses/repositories/course_repository.dart';
import 'package:app_mobile_college/features/courses/ui/home_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

const Course sampleCourse = Course(
  id: 1,
  code: 'INF-101',
  title: 'Introduction à la programmation',
  professor: 'Dr. R. Andrianina',
  credits: 6,
  schedule: 'Lundi 08:00 – 10:00 · Salle B12',
);

/// Returns each queued outcome in order; an outcome is either a course list
/// (success) or an exception (failure).
class FakeCourseRepository implements CourseRepository {
  FakeCourseRepository(this.outcomes);

  final List<Object> outcomes;
  int callCount = 0;

  @override
  Future<List<Course>> fetchCourses() async {
    final index = callCount < outcomes.length ? callCount : outcomes.length - 1;
    final outcome = outcomes[index];
    callCount += 1;
    if (outcome is Exception) {
      throw outcome;
    }
    return outcome as List<Course>;
  }
}

Widget buildTestApp(CourseListController controller) {
  return MaterialApp(home: HomeScreen(controller: controller));
}

void main() {
  testWidgets('shows the loading state, then the course list on success',
      (tester) async {
    final repository = FakeCourseRepository([
      [sampleCourse]
    ]);
    final controller = CourseListController(repository: repository);
    addTearDown(controller.dispose);

    await tester.pumpWidget(buildTestApp(controller));

    expect(find.text('Chargement des cours…'), findsOneWidget);

    await tester.pumpAndSettle();

    expect(find.text('App Mobile Collège'), findsOneWidget);
    expect(find.text('INF-101'), findsOneWidget);
    expect(find.text('Introduction à la programmation'), findsOneWidget);
    expect(find.text('Dr. R. Andrianina'), findsOneWidget);
    expect(find.textContaining('1 cours'), findsOneWidget); // summary header
  });

  testWidgets('shows the error state and recovers when retrying',
      (tester) async {
    final repository = FakeCourseRepository([
      const ApiException(ApiExceptionReason.network),
      [sampleCourse],
    ]);
    final controller = CourseListController(repository: repository);
    addTearDown(controller.dispose);

    await tester.pumpWidget(buildTestApp(controller));
    await tester.pumpAndSettle();

    expect(find.text('Oups, un problème est survenu'), findsOneWidget);
    expect(
      find.text('Impossible de contacter le serveur. '
          'Vérifiez votre connexion.'),
      findsOneWidget,
    );

    await tester.tap(find.text('Réessayer'));
    await tester.pumpAndSettle();

    expect(find.text('INF-101'), findsOneWidget);
    expect(repository.callCount, 2);
  });

  testWidgets('shows the empty state when the API returns no courses',
      (tester) async {
    final repository = FakeCourseRepository([
      <Course>[]
    ]);
    final controller = CourseListController(repository: repository);
    addTearDown(controller.dispose);

    await tester.pumpWidget(buildTestApp(controller));
    await tester.pumpAndSettle();

    expect(find.text('Aucun cours disponible'), findsOneWidget);
    expect(find.text('Actualiser'), findsOneWidget);
  });

  test('Course.fromJson tolerates missing and mistyped fields', () {
    final course = Course.fromJson(const {
      'id': '7',
      'title': '  Algèbre linéaire  ',
      'credits': 4.0,
    });

    expect(course.id, 7);
    expect(course.code, '');
    expect(course.title, 'Algèbre linéaire');
    expect(course.credits, 4);
    expect(course.hasSchedule, isFalse);
  });
}
