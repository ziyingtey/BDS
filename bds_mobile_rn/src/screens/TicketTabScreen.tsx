import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import type { RootNavigation } from '../navigation/types';
import { userSession } from '../state/userSession';

export function TicketTabScreen({ navigation }: { navigation: RootNavigation }) {
  const active = userSession.activeTicket;

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Text style={styles.title}>My Ticket</Text>
      {!active ? (
        <View style={styles.card}>
          <Text>No active queue ticket yet. Reserve one from Home → Branch Discovery.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.row}>Queue: {active.queueNumber}</Text>
          <Text style={styles.row}>Branch: {active.branchName}</Text>
          <Text style={styles.row}>Service: {active.serviceName}</Text>
          <Text style={styles.row}>Slot: {active.slotLabel}</Text>
          <Pressable
            style={styles.btn}
            onPress={() => navigation.navigate('QueueMonitoring', { ticket: active })}
          >
            <Text style={styles.btnText}>Open Queue Monitoring</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  card: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
  },
  row: { marginBottom: 6 },
  btn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnText: { color: '#3F51B5', fontWeight: '600' },
});
