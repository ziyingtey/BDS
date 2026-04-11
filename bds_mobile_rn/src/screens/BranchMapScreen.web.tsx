import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BranchMap'>;

/** Web bundle: avoid importing react-native-maps (native-only). */
export function BranchMapScreen(_props: Props) {
  return (
    <View style={styles.centered}>
      <Text style={styles.webMsg}>
        Branch map with GPS is available on the iOS or Android app (Expo Go or a dev build).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  webMsg: { color: '#555', textAlign: 'center', lineHeight: 22 },
});
