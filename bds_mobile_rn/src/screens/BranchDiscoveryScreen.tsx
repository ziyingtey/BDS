import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { mockBranches } from '../data/mockData';
import type { RootStackParamList } from '../navigation/types';
import type { Branch } from '../types/models';
import { allSlotsFull, branchWaitMins, isOvercrowded } from '../types/models';
import { userSession } from '../state/userSession';

type Props = NativeStackScreenProps<RootStackParamList, 'BranchDiscovery'>;

export function BranchDiscoveryScreen({ navigation }: Props) {
  const branches = useMemo(() => mockBranches(), []);
  const currentArea = 'Near Mid Valley';
  const candidates = branches.filter(
    (b) => b.isAvailable && !isOvercrowded(b) && !allSlotsFull(b)
  );
  const recommended =
    candidates.length > 0
      ? candidates.reduce((a, b) => (branchWaitMins(a) <= branchWaitMins(b) ? a : b))
      : branches[0];

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Text style={styles.hi}>Hi, {userSession.userName}</Text>
      <Text style={styles.muted}>Detected location (mock):</Text>
      <View style={styles.chip}>
        <Text>{currentArea}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Smart Branch Recommendation</Text>
        <Text style={styles.cardSub}>
          {recommended.name} • {recommended.distanceKm.toFixed(1)} km • ~
          {branchWaitMins(recommended)} mins
        </Text>
      </View>

      <Text style={styles.section}>All Branches</Text>
      {branches.map((branch) => (
        <BranchCard
          key={branch.id}
          branch={branch}
          onBook={() => navigation.navigate('SlotBooking', { branch })}
        />
      ))}
    </ScrollView>
  );
}

function BranchCard({ branch, onBook }: { branch: Branch; onBook: () => void }) {
  const wait = branchWaitMins(branch);
  const blocked = !branch.isAvailable || isOvercrowded(branch) || allSlotsFull(branch);
  let badge = 'Available';
  let badgeBg = '#DFF5E3';
  if (!branch.isAvailable || isOvercrowded(branch)) {
    badge = 'Overcrowded';
    badgeBg = '#FFE0E0';
  } else if (allSlotsFull(branch)) {
    badge = 'Slots Full';
    badgeBg = '#FFF3CD';
  }

  return (
    <View style={styles.branchCard}>
      <View style={styles.branchRow}>
        <Text style={styles.branchName}>{branch.name}</Text>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      </View>
      <Text style={styles.muted}>
        {branch.distanceKm.toFixed(1)} km away • Estimated wait {wait} mins
      </Text>
      <Pressable
        style={[styles.bookBtn, blocked && styles.bookBtnDisabled]}
        onPress={onBook}
        disabled={blocked}
      >
        <Text style={styles.bookBtnText}>
          {!branch.isAvailable || isOvercrowded(branch)
            ? 'Temporarily Unavailable'
            : allSlotsFull(branch)
              ? 'All Slots Full'
              : 'Reserve Queue Ticket'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 32 },
  hi: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  muted: { color: '#666', marginBottom: 4 },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  cardTitle: { fontWeight: '600', marginBottom: 4 },
  cardSub: { color: '#555' },
  section: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  branchCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  branchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  branchName: { fontWeight: '600', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12 },
  bookBtn: {
    marginTop: 10,
    backgroundColor: '#E8EAF6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookBtnDisabled: { opacity: 0.5 },
  bookBtnText: { color: '#3F51B5', fontWeight: '600' },
});
