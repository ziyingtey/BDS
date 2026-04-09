import 'package:bds_mobile/core/models/queue_ticket.dart';

class UserSession {
  int? userId;
  String userName = 'Guest User';
  String? email;
  String? role;
  String? token;
  int? preferredBranchId;
  QueueTicket? activeTicket;
}

final UserSession userSession = UserSession();
