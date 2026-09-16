/// Why an API call failed. Lets the UI map failures to friendly messages
/// without parsing transport details.
enum ApiExceptionReason { network, timeout, notFound, server, badResponse }

class ApiException implements Exception {
  const ApiException(this.reason, {this.message, this.statusCode});

  final ApiExceptionReason reason;
  final String? message;
  final int? statusCode;

  /// End-user ready message (French, matching the app locale).
  String get userFriendlyMessage => switch (reason) {
        ApiExceptionReason.network =>
          'Impossible de contacter le serveur. Vérifiez votre connexion.',
        ApiExceptionReason.timeout =>
          'Le serveur met trop de temps à répondre. Réessayez.',
        ApiExceptionReason.notFound =>
          'La ressource demandée est introuvable.',
        ApiExceptionReason.server =>
          message ?? 'Le serveur a rencontré une erreur.',
        ApiExceptionReason.badResponse =>
          'Réponse inattendue du serveur.',
      };

  @override
  String toString() =>
      'ApiException(${reason.name}, statusCode: $statusCode, message: $message)';
}
