import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchBranches, type BranchListItem } from '../api/branchApi';
import type { RootStackParamList } from '../navigation/types';
import type { Branch } from '../types/models';
import { waitLabelFromSource } from '../types/models';
import { userSession } from '../state/userSession';

type Props = NativeStackScreenProps<RootStackParamList, 'BranchDiscovery'>;

function mapBranch(b: BranchListItem): Branch {
  const cl = b.crowdLevel;
  const crowdLevel: Branch['crowdLevel'] =
    cl === 'Low' || cl === 'Moderate' || cl === 'High' ? cl : 'Low';
  return {
    id: b.id,
    name: b.name,
    distanceKm: b.distanceKm,
    crowdLevel,
    slotCapacity: b.slotCapacity,
    slotBooked: b.slotBooked,
    waitingCount: b.waitingCount,
    bookingDisabled: b.bookingDisabled,
    hasAvailableSlot: b.hasAvailableSlot,
    isOvercrowded: b.isOvercrowded,
    canBook: b.canBook,
    estimatedWaitMinutes: b.estimatedWaitMinutes,
    estimateSource: b.estimateSource,
  };
}

export function BranchDiscoveryScreen({ navigation }: Props) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const raw = await fetchBranches();
      setBranches(raw.map(mapBranch));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const waitFor = (b: Branch) => ({
    mins: Math.round(b.estimatedWaitMinutes),
    label: waitLabelFromSource(b.estimateSource),
  });

  const currentArea = 'Near Mid Valley';
  const candidates = useMemo(
    () => branches.filter((b) => b.canBook),
    [branches]
  );

  const recommended = useMemo(() => {
    if (branches.length === 0) return null;
    const pool = candidates.length > 0 ? candidates : branches;
    return pool.reduce((best, b) =>
      waitFor(b).mins <= waitFor(best).mins ? b : best
    );
  }, [branches, candidates]);

  const recWait = recommended ? waitFor(recommended) : null;

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Text style={styles.hi}>Hi, {userSession.userName}</Text>
      <Text style={styles.muted}>Detected location (demo label):</Text>
      <View style={styles.chip}>
        <Text>{currentArea}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator />
          <Text style={styles.muted}> Loading branches…</Text>
        </View>
      ) : null}

      {error ? (
        <Text style={styles.err}>
          {error}
          {'\n'}
          <Text style={styles.errHint}>Check backend URL and that SQL Server is running.</Text>
        </Text>
      ) : null}

      {recommended && recWait ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Smart Branch Recommendation</Text>
          <Text style={styles.cardSub}>
            {recommended.name} • {recommended.distanceKm.toFixed(1)} km • ~{recWait.mins} mins (
            {recWait.label})
          </Text>
        </View>
      ) : null}

      <Text style={styles.section}>All Branches</Text>
      {branches.map((branch) => (
        <BranchCard
          key={branch.id}
          branch={branch}
          waitInfo={waitFor(branch)}
          onBook={() => navigation.navigate('SlotBooking', { branch })}
        />
      ))}
    </ScrollView>
  );
}

function BranchCard({
  branch,
  waitInfo,
  onBook,
}: {
  branch: Branch;
  waitInfo: { mins: number; label: string };
  onBook: () => void;
}) {
  const blocked = !branch.canBook;
  let badge = 'Available';
  let badgeBg = '#DFF5E3';
  if (branch.bookingDisabled || branch.isOvercrowded) {
    badge = 'Overcrowded';
    badgeBg = '#FFE0E0';
  } else if (!branch.hasAvailableSlot) {
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
        {branch.distanceKm.toFixed(1)} km • Waiting: {branch.waitingCount} • Est. wait ~{waitInfo.mins}{' '}
        min ({waitInfo.label})
      </Text>
      <Pressable
        style={[styles.bookBtn, blocked && styles.bookBtnDisabled]}
        onPress={onBook}
        disabled={blocked}
      >
        <Text style={styles.bookBtnText}>
          {branch.bookingDisabled || branch.isOvercrowded
            ? 'Temporarily Unavailable'
            : !branch.hasAvailableSlot
              ? 'All Slots Full'
              : 'Reserve Queue Ticket'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 32 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  err: { color: '#b00020', marginBottom: 12 },
  errHint: { color: '#666', fontSize: 12 },
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
