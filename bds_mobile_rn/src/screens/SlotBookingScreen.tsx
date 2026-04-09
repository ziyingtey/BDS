import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { mockTimeSlots } from '../data/mockData';
import type { RootStackParamList } from '../navigation/types';
import { userSession } from '../state/userSession';

type Props = NativeStackScreenProps<RootStackParamList, 'SlotBooking'>;

const SERVICES = ['General Banking', 'Card Services', 'Wealth Management'];

export function SlotBookingScreen({ route, navigation }: Props) {
  const { branch } = route.params;
  const slots = useMemo(() => mockTimeSlots(), []);
  const [service, setService] = useState(SERVICES[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const availableCount = slots.filter((s) => s.booked < s.capacity).length;

  const confirm = () => {
    if (!selectedSlot) return;
    const n = Date.now() % 200;
    const queueNumber = `Q-${n + 101}`;
    userSession.activeTicket = {
      branchName: branch.name,
      serviceName: service,
      slotLabel: selectedSlot,
      queueNumber,
    };
    navigation.navigate('QueueMonitoring', { ticket: userSession.activeTicket });
  };

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Text style={styles.title}>Reserve Queue Ticket</Text>
      <Text style={styles.branch}>{branch.name}</Text>

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
                <Text>{sel ? 'Selected' : 'Select'}</Text>
              </Pressable>
            )}
          </View>
        );
      })}

      <Pressable
        style={[styles.confirm, !selectedSlot && styles.confirmOff]}
        onPress={confirm}
        disabled={!selectedSlot}
      >
        <Text style={styles.confirmText}>Confirm Reservation</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 40 },
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
