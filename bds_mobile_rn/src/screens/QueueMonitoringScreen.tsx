import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { QueueTicket } from '../types/models';
import { userSession } from '../state/userSession';

type Props = NativeStackScreenProps<RootStackParamList, 'QueueMonitoring'>;

export function QueueMonitoringScreen({ route }: Props) {
  const initial = route.params.ticket;
  const [ticket, setTicket] = useState<QueueTicket>(initial);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [autoReschedule, setAutoReschedule] = useState(true);
  const [ticketCancelled, setTicketCancelled] = useState(false);
  const [customersAhead, setCustomersAhead] = useState(6);
  const [estimatedWaitMins, setEstimatedWaitMins] = useState(24);

  const currentlyServing = useMemo(() => {
    const num = parseInt(ticket.queueNumber.replace(/^Q-/, ''), 10);
    const serving = num - customersAhead;
    return `Q-${serving}`;
  }, [ticket.queueNumber, customersAhead]);

  useEffect(() => {
    if (ticketCancelled) return undefined;
    const t = setInterval(() => {
      setCustomersAhead((a) => {
        if (a <= 0) return 0;
        return a - 1;
      });
      setEstimatedWaitMins((w) => Math.max(3, Math.min(60, w - 3)));
    }, 4000);
    return () => clearInterval(t);
  }, [ticketCancelled]);

  const cancelTicket = () => {
    setTicketCancelled(true);
    userSession.activeTicket = null;
  };

  const simulateMissed = () => {
    if (autoReschedule) {
      setTicket({
        ...ticket,
        slotLabel: 'Next available slot',
        queueNumber: 'Q-208',
      });
      setCustomersAhead(5);
      setEstimatedWaitMins(20);
    } else {
      cancelTicket();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <View style={styles.card}>
        <Text style={styles.row}>Branch: {ticket.branchName}</Text>
        <Text style={styles.row}>Service: {ticket.serviceName}</Text>
        <Text style={styles.row}>Time slot: {ticket.slotLabel}</Text>
        <Text style={styles.row}>Your queue number: {ticket.queueNumber}</Text>
      </View>

      <View style={styles.metric}>
        <Text>Currently serving</Text>
        <Text style={styles.big}>{currentlyServing}</Text>
      </View>
      <View style={styles.metric}>
        <Text>Customers ahead of you</Text>
        <Text style={styles.big}>{customersAhead}</Text>
      </View>
      <View style={styles.metric}>
        <Text>Estimated waiting time</Text>
        <Text style={styles.big}>{estimatedWaitMins} mins</Text>
      </View>

      <View style={styles.switchRow}>
        <Text>Push alert when queue is near</Text>
        <Switch value={notificationsOn} onValueChange={setNotificationsOn} />
      </View>
      <View style={styles.switchRow}>
        <Text>Auto-reschedule if queue missed</Text>
        <Switch value={autoReschedule} onValueChange={setAutoReschedule} />
      </View>

      <Pressable
        style={[styles.tonal, ticketCancelled && styles.disabled]}
        onPress={simulateMissed}
        disabled={ticketCancelled}
      >
        <Text style={styles.tonalText}>Simulate Missed Arrival</Text>
      </Pressable>
      <Pressable
        style={styles.outline}
        onPress={cancelTicket}
        disabled={ticketCancelled}
      >
        <Text>Cancel Ticket</Text>
      </Pressable>
      {ticketCancelled ? (
        <Text style={styles.cancelled}>Status: Ticket cancelled</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 32 },
  card: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  row: { marginBottom: 6 },
  metric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
  },
  big: { fontSize: 22, fontWeight: '700' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  tonal: {
    backgroundColor: '#E8EAF6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  tonalText: { color: '#3F51B5', fontWeight: '600' },
  outline: {
    marginTop: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  disabled: { opacity: 0.5 },
  cancelled: { color: '#c00', fontWeight: '700', marginTop: 12 },
});
