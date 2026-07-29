import { Capacitor } from '@capacitor/core';
import type { ManagedAssignment } from './managementPortalService';

export const ASSIGNMENT_NOTIFICATION_OPEN_EVENT = 'learning-rogue:open-assignment-inbox';

const NOTIFICATION_STATE_KEY = 'learning_rogue_assignment_notification_state_v1';
const ANDROID_CHANNEL_ID = 'assignments';

type NotificationState = {
  learnerId: string;
  assignmentIds: string[];
};

type ElectronNotificationApi = {
  isElectron?: boolean;
  notifyAssignment?: (payload: { assignmentId: string; title: string; body: string }) => Promise<boolean>;
  onAssignmentNotificationClick?: (listener: (assignmentId: string) => void) => (() => void);
};

let nativeListenerReady = false;
let electronListenerReady = false;

const readState = (): NotificationState | null => {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem(NOTIFICATION_STATE_KEY) || 'null') as NotificationState | null;
  } catch {
    return null;
  }
};

const writeState = (state: NotificationState) => {
  try {
    window.localStorage.setItem(NOTIFICATION_STATE_KEY, JSON.stringify(state));
  } catch {
    // Notification persistence must never block assignment sync.
  }
};

const dispatchOpenInbox = (assignmentId?: string) => {
  window.dispatchEvent(new CustomEvent(ASSIGNMENT_NOTIFICATION_OPEN_EVENT, {
    detail: { assignmentId: assignmentId || '' },
  }));
};

const notificationIdForAssignment = (assignmentId: string) => {
  let hash = 2166136261;
  for (const character of assignmentId) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (Math.abs(hash) % 2_000_000_000) + 1;
};

const getNotificationCopy = (assignment: ManagedAssignment) => ({
  title: '新しい課題が届きました',
  body: `${assignment.sourceGroupName ? `${assignment.sourceGroupName}から ` : ''}${assignment.title}（${assignment.unitLabel}）`,
});

const notifyWithNativeApi = async (assignment: ManagedAssignment) => {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  if (!nativeListenerReady) {
    nativeListenerReady = true;
    await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
      dispatchOpenInbox(String(event.notification.extra?.assignmentId || ''));
    });
  }

  const permission = await LocalNotifications.checkPermissions();
  const resolvedPermission = permission.display === 'prompt'
    ? await LocalNotifications.requestPermissions()
    : permission;
  if (resolvedPermission.display !== 'granted') return false;

  if (Capacitor.getPlatform() === 'android') {
    await LocalNotifications.createChannel({
      id: ANDROID_CHANNEL_ID,
      name: '課題通知',
      description: '保護者・先生から新しい課題が届いたことを通知します',
      importance: 4,
      vibration: true,
    });
  }

  const copy = getNotificationCopy(assignment);
  await LocalNotifications.schedule({
    notifications: [{
      id: notificationIdForAssignment(assignment.id),
      title: copy.title,
      body: copy.body,
      schedule: { at: new Date(Date.now() + 250), allowWhileIdle: true },
      channelId: Capacitor.getPlatform() === 'android' ? ANDROID_CHANNEL_ID : undefined,
      extra: { assignmentId: assignment.id },
    }],
  });
  return true;
};

const notifyWithElectronApi = async (assignment: ManagedAssignment, api: ElectronNotificationApi) => {
  if (!electronListenerReady && api.onAssignmentNotificationClick) {
    electronListenerReady = true;
    api.onAssignmentNotificationClick((assignmentId) => dispatchOpenInbox(assignmentId));
  }
  const copy = getNotificationCopy(assignment);
  return Boolean(await api.notifyAssignment?.({
    assignmentId: assignment.id,
    title: copy.title,
    body: copy.body,
  }));
};

const notifyWithBrowserApi = async (assignment: ManagedAssignment) => {
  if (!('Notification' in window)) return false;
  const permission = Notification.permission === 'default'
    ? await Notification.requestPermission()
    : Notification.permission;
  if (permission !== 'granted') return false;
  const copy = getNotificationCopy(assignment);
  const notification = new Notification(copy.title, {
    body: copy.body,
    icon: new URL('apple-touch-icon.png', document.baseURI).toString(),
    tag: `assignment:${assignment.id}`,
  });
  notification.onclick = () => {
    window.focus();
    dispatchOpenInbox(assignment.id);
    notification.close();
  };
  return true;
};

const notifyAssignment = async (assignment: ManagedAssignment) => {
  if (Capacitor.isNativePlatform()) {
    return notifyWithNativeApi(assignment);
  }
  const electronApi = (window as Window & { learningRogue?: ElectronNotificationApi }).learningRogue;
  if (electronApi?.isElectron && electronApi.notifyAssignment) {
    return notifyWithElectronApi(assignment, electronApi);
  }
  return notifyWithBrowserApi(assignment);
};

export const assignmentNotificationService = {
  async observeAssignments(learnerId: string, assignments: ManagedAssignment[]) {
    if (typeof window === 'undefined' || !learnerId) return [];
    const assignmentIds = Array.from(new Set(assignments.map((assignment) => assignment.id).filter(Boolean)));
    const previous = readState();

    // The first observation for a learner establishes the baseline. This avoids
    // announcing every historical assignment after an app update or new link.
    if (!previous || previous.learnerId !== learnerId) {
      writeState({ learnerId, assignmentIds });
      return [];
    }

    const seen = new Set(previous.assignmentIds);
    const newlyDelivered = assignments.filter((assignment) => !seen.has(assignment.id));
    writeState({
      learnerId,
      assignmentIds: Array.from(new Set([...previous.assignmentIds, ...assignmentIds])).slice(-500),
    });

    for (const assignment of newlyDelivered) {
      try {
        await notifyAssignment(assignment);
      } catch (error) {
        console.warn('Failed to show assignment notification', error);
      }
    }
    return newlyDelivered.map((assignment) => assignment.id);
  },
};
