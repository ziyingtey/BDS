import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import type { RootStackParamList } from '../navigation/types';
import { branchPins, type BranchPin } from '../data/branches';
import { getDistance } from '../utils/distance';

type Props = NativeStackScreenProps<RootStackParamList, 'BranchMap'>;

type LatLng = { latitude: number; longitude: number };

function findNearestBranch(userLat: number, userLng: number): BranchPin | null {
  let minDistance = Infinity;
  let closest: BranchPin | null = null;
  for (const branch of branchPins) {
    const distance = getDistance(userLat, userLng, branch.latitude, branch.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      closest = branch;
    }
  }
  return closest;
}

export function BranchMapScreen(_props: Props) {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [nearestBranch, setNearestBranch] = useState<BranchPin | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLocation = useCallback(async () => {
    setError(null);
    setPermissionDenied(false);
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        setPermissionDenied(true);
        setLocation(null);
        setNearestBranch(null);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;
      setLocation({ latitude, longitude });
      setNearestBranch(findNearestBranch(latitude, longitude));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLocation(null);
      setNearestBranch(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Getting your location…</Text>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Location needed</Text>
        <Text style={styles.muted}>
          Allow location access to see the map and find your nearest branch.
        </Text>
        <Pressable style={styles.retryBtn} onPress={loadLocation}>
          <Text style={styles.retryBtnText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.err}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={loadLocation}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Could not read GPS coordinates.</Text>
        <Pressable style={styles.retryBtn} onPress={loadLocation}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={location} title="You are here" />
        {branchPins.map((branch) => (
          <Marker
            key={branch.id}
            coordinate={{ latitude: branch.latitude, longitude: branch.longitude }}
            title={branch.name}
          />
        ))}
      </MapView>

      {nearestBranch ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nearest branch</Text>
          <Text style={styles.cardBody}>{nearestBranch.name}</Text>
          <Text style={styles.cardMeta}>
            ~{' '}
            {getDistance(
              location.latitude,
              location.longitude,
              nearestBranch.latitude,
              nearestBranch.longitude
            ).toFixed(2)}{' '}
            km (straight line)
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  map: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  muted: { color: '#666', textAlign: 'center', marginTop: 8 },
  err: { color: '#b00020', textAlign: 'center', marginBottom: 12 },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#E8EAF6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryBtnText: { color: '#3F51B5', fontWeight: '600' },
  card: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cardTitle: { fontWeight: '700', fontSize: 16, marginBottom: 4 },
  cardBody: { fontSize: 15 },
  cardMeta: { color: '#666', marginTop: 6, fontSize: 13 },
});
