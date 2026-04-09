import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authApi } from '../api/authApi';
import { fetchBranches } from '../api/branchApi';
import type { RootStackParamList } from '../navigation/types';
import { userSession } from '../state/userSession';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileEditScreen({ navigation }: Props) {
  const [name, setName] = useState(userSession.userName);
  const [preferredId, setPreferredId] = useState<number | null>(userSession.preferredBranchId);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchBranches();
        if (!cancelled) setBranches(list.map((b) => ({ id: b.id, name: b.name })));
      } catch {
        if (!cancelled) setBranches([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = () => {
    userSession.userName = name.trim() || 'Guest User';
    navigation.goBack();
  };

  const confirmDelete = async () => {
    if (!userSession.token) {
      Alert.alert('Error', 'Please login first.');
      return;
    }
    setDeleting(true);
    try {
      await authApi.deleteAccount(userSession.token, deletePassword.trim());
      userSession.userId = null;
      userSession.token = null;
      userSession.email = null;
      userSession.role = null;
      userSession.activeTicket = null;
      setDeleteOpen(false);
      navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
      Alert.alert('Done', 'Account deleted successfully.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Error', msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <TextInput
        style={styles.input}
        placeholder="Display Name"
        value={name}
        onChangeText={setName}
      />
      <Text style={styles.row}>Email: {userSession.email ?? '-'}</Text>
      <Text style={styles.row}>Role: {userSession.role ?? '-'}</Text>

      <Text style={styles.label}>Preferred Branch</Text>
      {branches.map((b) => (
        <Pressable
          key={b.id}
          style={[styles.branchPick, preferredId === b.id && styles.branchPickOn]}
          onPress={() => {
            userSession.preferredBranchId = b.id;
            setPreferredId(b.id);
          }}
        >
          <Text>{b.name}</Text>
        </Pressable>
      ))}

      <Pressable style={styles.save} onPress={save}>
        <Text style={styles.saveText}>Save Profile</Text>
      </Pressable>

      <Pressable style={styles.danger} onPress={() => setDeleteOpen(true)}>
        <Text style={styles.dangerText}>Delete Account</Text>
      </Pressable>

      <Modal visible={deleteOpen} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setDeleteOpen(false)} style={styles.modalBtn}>
                <Text>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmDelete}
                disabled={deleting}
                style={[styles.modalBtn, styles.modalDanger]}
              >
                {deleting ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={{ color: '#fff' }}>Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  row: { marginBottom: 8 },
  label: { fontWeight: '600', marginTop: 8, marginBottom: 8 },
  branchPick: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 8,
  },
  branchPickOn: { backgroundColor: '#E8EAF6', borderColor: '#3F51B5' },
  save: {
    marginTop: 16,
    backgroundColor: '#3F51B5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '600' },
  danger: {
    marginTop: 16,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c00',
  },
  dangerText: { color: '#c00', fontWeight: '600' },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  modalTitle: { fontWeight: '700', marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  modalBtn: { padding: 12 },
  modalDanger: { backgroundColor: '#c00', borderRadius: 8 },
});
