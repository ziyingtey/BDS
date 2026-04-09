import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Branch, QueueTicket } from '../types/models';

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  BranchDiscovery: undefined;
  Profile: undefined;
  SlotBooking: { branch: Branch };
  QueueMonitoring: { ticket: QueueTicket };
};

/** Root stack navigation (shared by main shell + tab panels). */
export type RootNavigation = NativeStackNavigationProp<RootStackParamList>;
