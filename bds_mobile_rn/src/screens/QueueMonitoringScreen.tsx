import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { QueueTicket } from '../types/models';
import { waitLabelFromSource } from '../types/models';
import { userSession } from '../state/userSession';
import { cancelBooking, fetchTicketStatus, type TicketStatus } from '../api/bookingApi';

type Props = NativeStackScreenProps<RootStackParamList, 'QueueMonitoring'>;

export function QueueMonitoringScreen({ route }: Props) {
  const initial = route.params.ticket;
  const [ticket] = useState<QueueTicket>(initial);
  const [status, setStatus] = useState<TicketStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollError, setPollError] = useState<string | null>(null);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [ticketCancelled, setTicketCancelled] = useState(false);
  const [ticketEnded, setTicketEnded] = useState(false);

  const token = userSession.token;

  const refresh = useCallback(async () => {
    if (!token || ticketCancelled || ticketEnded) return;
    try {
      setPollError(null);
      const s = await fetchTicketStatus(token, ticket.ticketId);
      setStatus(s);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('404')) {
        setTicketEnded(true);
        setPollError(null);
      } else {
        setPollError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [token, ticket.ticketId, ticketCancelled, ticketEnded]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (ticketCancelled || ticketEnded || !token) return undefined;
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [refresh, ticketCancelled, ticketEnded, token]);

  const cancelTicket = async () => {
    if (!token) {
      Alert.alert('Session', 'Not signed in.');
      return;
    }
    try {
      await cancelBooking(token, ticket.ticketId);
      setTicketCancelled(true);
      userSession.activeTicket = null;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Cancel failed', msg);
    }
  };

  const display = status;

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <View style={styles.card}>
        <Text style={styles.row}>Branch: {ticket.branchName}</Text>
        <Text style={styles.row}>Service: {ticket.serviceName}</Text>
        <Text style={styles.row}>Time slot: {ticket.slotLabel}</Text>
        <Text style={styles.row}>Your queue number: {ticket.queueNumber}</Text>
      </View>

      {loading && !display ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator />
          <Text style={styles.muted}> Loading live queue…</Text>
        </View>
      ) : null}

      {ticketEnded ? (
        <Text style={styles.ended}>This ticket is no longer active (served or cancelled).</Text>
      ) : null}
      {pollError ? <Text style={styles.err}>{pollError}</Text> : null}

      <View style={styles.metric}>
        <Text>Currently serving</Text>
        <Text style={styles.big}>{display?.nowServingLabel ?? '—'}</Text>
      </View>
      <View style={styles.metric}>
        <Text>Customers ahead of you</Text>
        <Text style={styles.big}>{display !== null ? display.customersAhead : '—'}</Text>
      </View>
      <View style={styles.metric}>
        <Text>Estimated waiting time</Text>
        <Text style={styles.big}>
          {display !== null
            ? `${Math.round(display.estimatedWaitMinutes)} mins (${waitLabelFromSource(display.estimateSource)})`
            : '—'}
        </Text>
      </View>

      <View style={styles.switchRow}>
        <Text>Push alert when queue is near</Text>
        <Switch value={notificationsOn} onValueChange={setNotificationsOn} />
      </View>
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
  loadingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  err: { color: '#b00020', marginBottom: 8 },
  ended: { color: '#555', marginBottom: 8, fontWeight: '600' },
  muted: { color: '#666' },
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
  big: { fontSize: 22, fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 8 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  outline: {
    marginTop: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  cancelled: { color: '#c00', fontWeight: '700', marginTop: 12 },
});
