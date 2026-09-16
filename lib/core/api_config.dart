/// Compile-time configuration for the API layer.
///
/// Nothing sensitive is hardcoded here: the base URL is injected at build
/// time with `--dart-define`, e.g.
///
/// ```sh
/// flutter run --dart-define=API_BASE_URL=https://api.example.com
/// ```
///
/// The default value targets the Android emulator alias for the host machine
/// (`10.0.2.2`), which is where the local backend is reachable from the app.
class ApiConfig {
  const ApiConfig._();

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  static const String coursesPath = '/api/courses';

  static const Duration requestTimeout = Duration(seconds: 10);
}
