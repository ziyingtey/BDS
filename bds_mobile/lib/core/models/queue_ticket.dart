class QueueTicket {
  final String branchName;
  final String serviceName;
  final String slotLabel;
  final String queueNumber;

  const QueueTicket({
    required this.branchName,
    required this.serviceName,
    required this.slotLabel,
    required this.queueNumber,
  });

  QueueTicket copyWith({
    String? branchName,
    String? serviceName,
    String? slotLabel,
    String? queueNumber,
  }) {
    return QueueTicket(
      branchName: branchName ?? this.branchName,
      serviceName: serviceName ?? this.serviceName,
      slotLabel: slotLabel ?? this.slotLabel,
      queueNumber: queueNumber ?? this.queueNumber,
    );
  }
}
