import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { fetchBranches } from '../api/branchApi';
import type { RootNavigation } from '../navigation/types';
import { userSession } from '../state/userSession';

export function ProfileTabScreen({ navigation }: { navigation: RootNavigation }) {
  const [branchNames, setBranchNames] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchBranches();
        if (!cancelled) setBranchNames(list.map((b) => ({ id: b.id, name: b.name })));
      } catch {
        if (!cancelled) setBranchNames([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const preferred =
    branchNames.find((b) => b.id === userSession.preferredBranchId)?.name ?? 'Not set';

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.row}>Name: {userSession.userName}</Text>
      <Text style={styles.row}>Preferred branch: {preferred}</Text>
      <Pressable style={styles.btn} onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.btnText}>Edit Profile</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
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
