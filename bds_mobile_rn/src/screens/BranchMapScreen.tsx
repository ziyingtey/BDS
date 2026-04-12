import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import type { RootStackParamList } from '../navigation/types';
import { branchPins, type BranchPin } from '../data/branches';
import { getDistance } from '../utils/distance';
import { fetchBranches } from '../api/branchApi';

type Props = NativeStackScreenProps<RootStackParamList, 'BranchMap'>;

type LatLng = { latitude: number; longitude: number };

const LOCATION_TIMEOUT_MS = 20000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      }
    );
  });
}

function findNearestBranch(userLat: number, userLng: number, pins: BranchPin[]): BranchPin | null {
  let minDistance = Infinity;
  let closest: BranchPin | null = null;
  for (const branch of pins) {
    const distance = getDistance(userLat, userLng, branch.latitude, branch.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      closest = branch;
    }
  }
  return closest;
}

/** Map starts over branch pins so the map is never a blank full-screen loader. */
function defaultRegionFromPins(pins: BranchPin[]): Region {
  if (pins.length === 0) {
    return { latitude: 3.14, longitude: 101.69, latitudeDelta: 0.35, longitudeDelta: 0.35 };
  }
  const lat = pins.reduce((s, b) => s + b.latitude, 0) / pins.length;
  const lon = pins.reduce((s, b) => s + b.longitude, 0) / pins.length;
  return {
    latitude: lat,
    longitude: lon,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
  };
}

export function BranchMapScreen(_props: Props) {
  const mapRef = useRef<MapView>(null);
  const [mapPins, setMapPins] = useState<BranchPin[]>(branchPins);
  const initialMapRegion = useMemo(() => defaultRegionFromPins(mapPins), [mapPins]);

  const [location, setLocation] = useState<LatLng | null>(null);
  const [nearestBranch, setNearestBranch] = useState<BranchPin | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [locating, setLocating] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [servicesOff, setServicesOff] = useState(false);

  const applyPosition = useCallback((latitude: number, longitude: number) => {
    setLocation({ latitude, longitude });
    mapRef.current?.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      600
    );
  }, []);

  useEffect(() => {
    fetchBranches()
      .then((list) => {
        const fromApi = list
          .filter((b) => b.latitude != null && b.longitude != null)
          .map((b) => ({
            id: b.id,
            name: b.name,
            latitude: b.latitude as number,
            longitude: b.longitude as number,
          }));
        if (fromApi.length > 0) setMapPins(fromApi);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!location) {
      setNearestBranch(null);
      return;
    }
    setNearestBranch(findNearestBranch(location.latitude, location.longitude, mapPins));
  }, [location, mapPins]);

  const loadLocation = useCallback(async () => {
    setLocationError(null);
    setServicesOff(false);
    setPermissionDenied(false);
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        setPermissionGranted(false);
        setPermissionDenied(true);
        setLocation(null);
        setNearestBranch(null);
        return;
      }
      setPermissionGranted(true);

      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setServicesOff(true);
        setLocation(null);
        setNearestBranch(null);
        return;
      }

      const last = await Location.getLastKnownPositionAsync({
        maxAge: 120_000,
        requiredAccuracy: 500,
      });
      if (last?.coords) {
        applyPosition(last.coords.latitude, last.coords.longitude);
      }

      let pos: Location.LocationObject | null = null;
      try {
        pos = await withTimeout(
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          LOCATION_TIMEOUT_MS,
          'Location timed out — try outdoors, or set a mock location on the emulator.'
        );
      } catch {
        try {
          pos = await withTimeout(
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Low,
            }),
            LOCATION_TIMEOUT_MS,
            'Location still unavailable.'
          );
        } catch {
          pos = last;
        }
      }

      if (pos?.coords) {
        applyPosition(pos.coords.latitude, pos.coords.longitude);
      } else if (!last?.coords) {
        setLocationError('Could not read GPS coordinates.');
        setLocation(null);
        setNearestBranch(null);
      }
    } catch (e) {
      setLocationError(e instanceof Error ? e.message : String(e));
      setLocation(null);
      setNearestBranch(null);
    } finally {
      setLocating(false);
    }
  }, [applyPosition]);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  const mapProvider = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={mapProvider}
        initialRegion={initialMapRegion}
        showsUserLocation={permissionGranted}
        showsMyLocationButton={permissionGranted}
      >
        {location ? (
          <Marker coordinate={location} title="You are here" pinColor="#1565C0" />
        ) : null}
        {mapPins.map((branch) => (
          <Marker
            key={branch.id}
            coordinate={{ latitude: branch.latitude, longitude: branch.longitude }}
            title={branch.name}
          />
        ))}
      </MapView>

      {permissionDenied ? (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Location permission off</Text>
          <Text style={styles.bannerText}>Enable location to see your GPS dot and nearest branch.</Text>
          <Pressable style={styles.bannerBtn} onPress={loadLocation}>
            <Text style={styles.bannerBtnText}>Try again</Text>
          </Pressable>
        </View>
      ) : null}

      {servicesOff ? (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Location services off</Text>
          <Text style={styles.bannerText}>Turn on GPS/location in device settings, then retry.</Text>
          <Pressable style={styles.bannerBtn} onPress={loadLocation}>
            <Text style={styles.bannerBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {locationError && !permissionDenied && !servicesOff ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{locationError}</Text>
          <Pressable style={styles.bannerBtn} onPress={loadLocation}>
            <Text style={styles.bannerBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {locating ? (
        <View style={styles.locatingStrip}>
          <ActivityIndicator color="#3F51B5" />
          <Text style={styles.locatingText}>Finding your location…</Text>
        </View>
      ) : null}

      {location && nearestBranch ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nearest branch</Text>
          <Text style={styles.cardBody}>{nearestBranch.name}</Text>
          <Text style={styles.cardMeta}>
            Your GPS: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </Text>
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
  banner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 12,
    left: 12,
    right: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  bannerTitle: { fontWeight: '700', fontSize: 15, marginBottom: 4 },
  bannerText: { color: '#444', fontSize: 14, lineHeight: 20 },
  bannerBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#E8EAF6',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  bannerBtnText: { color: '#3F51B5', fontWeight: '600', fontSize: 14 },
  locatingStrip: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  locatingText: { color: '#333', fontSize: 14, flex: 1 },
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
