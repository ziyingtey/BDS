import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { mockBranches } from '../data/mockData';
import type { RootNavigation } from '../navigation/types';
import { userSession } from '../state/userSession';

export function ProfileTabScreen({ navigation }: { navigation: RootNavigation }) {
  const branches = mockBranches();
  const preferred = branches.find((b) => b.id === userSession.preferredBranchId)?.name ?? 'Not set';

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
