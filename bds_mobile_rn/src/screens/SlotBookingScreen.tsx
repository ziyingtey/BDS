import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchBranchSlots, type BranchTimeSlotRow } from '../api/branchApi';
import { createBooking } from '../api/bookingApi';
import type { RootStackParamList } from '../navigation/types';
import { userSession } from '../state/userSession';

type Props = NativeStackScreenProps<RootStackParamList, 'SlotBooking'>;

const SERVICES = ['General Banking', 'Card Services', 'Wealth Management'];

export function SlotBookingScreen({ route, navigation }: Props) {
  const { branch } = route.params;
  const [slots, setSlots] = useState<BranchTimeSlotRow[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [service, setService] = useState(SERVICES[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadSlots = useCallback(async () => {
    setSlotsError(null);
    setLoadingSlots(true);
    try {
      const rows = await fetchBranchSlots(branch.id);
      setSlots(rows);
    } catch (e) {
      setSlotsError(e instanceof Error ? e.message : String(e));
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [branch.id]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const availableCount = slots.filter((s) => s.booked < s.capacity).length;

  const confirm = async () => {
    if (!selectedSlot) return;
    const token = userSession.token;
    if (!token) {
      Alert.alert('Sign in required', 'Please log in to reserve a queue ticket.', [
        { text: 'OK', onPress: () => navigation.navigate('Auth') },
      ]);
      return;
    }

    setSubmitting(true);
    try {
      const res = await createBooking(token, {
        branchId: branch.id,
        serviceType: service,
        timeSlotLabel: selectedSlot,
      });
      userSession.activeTicket = {
        ticketId: res.ticketId,
        branchId: res.branchId,
        branchName: res.branchName,
        serviceName: res.serviceType,
        slotLabel: res.timeSlotLabel,
        queueNumber: res.queueLabel,
      };
      navigation.navigate('QueueMonitoring', { ticket: userSession.activeTicket });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Booking failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Text style={styles.title}>Reserve Queue Ticket</Text>
      <Text style={styles.branch}>{branch.name}</Text>

      {loadingSlots ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator />
          <Text style={styles.muted}> Loading time slots…</Text>
        </View>
      ) : null}

      {slotsError ? <Text style={styles.err}>{slotsError}</Text> : null}

      <Text style={styles.label}>Select Service</Text>
      <View style={styles.row}>
        {SERVICES.map((s) => (
          <Pressable
            key={s}
            style={[styles.chip, service === s && styles.chipOn]}
            onPress={() => setService(s)}
          >
            <Text style={service === s ? styles.chipTextOn : undefined}>{s}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.avail}>
        Available slots: {availableCount}/{slots.length}
      </Text>
      {slots.map((slot) => {
        const full = slot.booked >= slot.capacity;
        const sel = selectedSlot === slot.label;
        return (
          <View key={slot.label} style={styles.slotRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.slotTitle}>{slot.label}</Text>
              <Text style={styles.muted}>
                Capacity {slot.booked}/{slot.capacity}
              </Text>
            </View>
            {full ? (
              <View style={styles.fullBadge}>
                <Text>Full</Text>
              </View>
            ) : (
              <Pressable
                style={[styles.selectChip, sel && styles.selectChipOn]}
                onPress={() => setSelectedSlot(slot.label)}
              >
                <Text style={sel ? styles.selectOn : undefined}>{sel ? 'Selected' : 'Select'}</Text>
              </Pressable>
            )}
          </View>
        );
      })}

      <Pressable
        style={[styles.confirm, (!selectedSlot || submitting) && styles.confirmOff]}
        onPress={confirm}
        disabled={!selectedSlot || submitting}
      >
        <Text style={styles.confirmText}>
          {submitting ? 'Confirming…' : 'Confirm Reservation'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 40 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  err: { color: '#b00020', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  branch: { color: '#666', marginBottom: 16 },
  label: { fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  chipOn: { backgroundColor: '#E8EAF6', borderColor: '#3F51B5' },
  chipTextOn: { fontWeight: '600' },
  avail: { fontWeight: '600', marginBottom: 8 },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  slotTitle: { fontWeight: '500' },
  muted: { color: '#666', fontSize: 12 },
  fullBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#eee', borderRadius: 8 },
  selectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectChipOn: { backgroundColor: '#3F51B5', borderColor: '#3F51B5' },
  selectOn: { color: '#fff', fontWeight: '600' },
  confirm: {
    marginTop: 16,
    backgroundColor: '#3F51B5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmOff: { opacity: 0.4 },
  confirmText: { color: '#fff', fontWeight: '600' },
});
