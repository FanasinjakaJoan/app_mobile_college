/// Immutable course entity, parsed defensively so a malformed API payload
/// can never crash the UI.
class Course {
  const Course({
    required this.id,
    required this.code,
    required this.title,
    required this.professor,
    required this.credits,
    required this.schedule,
  });

  factory Course.fromJson(Map<String, dynamic> json) {
    return Course(
      id: _asInt(json['id']),
      code: _asString(json['code']),
      title: _asString(json['title']),
      professor: _asString(json['professor']),
      credits: _asInt(json['credits']),
      schedule: _asString(json['schedule']),
    );
  }

  final int id;
  final String code;
  final String title;
  final String professor;
  final int credits;
  final String schedule;

  bool get hasSchedule => schedule.isNotEmpty;

  static int _asInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.round();
    return int.tryParse('$value') ?? 0;
  }

  static String _asString(dynamic value) {
    if (value is String) return value.trim();
    return value == null ? '' : '$value';
  }
}
