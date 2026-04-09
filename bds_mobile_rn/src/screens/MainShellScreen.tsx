import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { RootNavigation } from '../navigation/types';
import { HomeTabScreen } from './HomeTabScreen';
import { TicketTabScreen } from './TicketTabScreen';
import { ProfileTabScreen } from './ProfileTabScreen';

type Props = {
  navigation: RootNavigation;
};

export function MainShellScreen({ navigation }: Props) {
  const [tab, setTab] = useState(0);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BDS Smart Branch</Text>
      </View>
      <View style={styles.body}>
        {tab === 0 ? (
          <HomeTabScreen navigation={navigation} />
        ) : tab === 1 ? (
          <TicketTabScreen navigation={navigation} />
        ) : (
          <ProfileTabScreen navigation={navigation} />
        )}
      </View>
      <View style={styles.tabBar}>
        <Pressable style={styles.tabItem} onPress={() => setTab(0)}>
          <Text style={[styles.tabLabel, tab === 0 && styles.tabLabelActive]}>Home</Text>
        </Pressable>
        <Pressable style={styles.tabItem} onPress={() => setTab(1)}>
          <Text style={[styles.tabLabel, tab === 1 && styles.tabLabelActive]}>My Ticket</Text>
        </Pressable>
        <Pressable style={styles.tabItem} onPress={() => setTab(2)}>
          <Text style={[styles.tabLabel, tab === 2 && styles.tabLabelActive]}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  body: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabLabel: { color: '#666', fontSize: 13 },
  tabLabelActive: { color: '#3F51B5', fontWeight: '700' },
});
