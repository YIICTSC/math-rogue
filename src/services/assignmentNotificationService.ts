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
let remoteListenerReady = false;

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

export const openAssignmentInboxFromNotification = (assignmentId?: string) => {
  if (typeof window !== 'undefined') dispatchOpenInbox(assignmentId);
};

export const enableRemoteAssignmentNotifications = async (
  registerToken: (payload: { provider: 'apns' | 'fcm'; token: string }) => Promise<unknown>,
) => {
  if (!Capacitor.isNativePlatform()) return false;
  const platform = Capacitor.getPlatform();
  if (platform !== 'ios' && platform !== 'android') return false;
  const { PushNotifications } = await import('@capacitor/push-notifications');

  if (!remoteListenerReady) {
    remoteListenerReady = true;
    await PushNotifications.addListener('registration', (registration) => {
      void registerToken({ provider: platform === 'ios' ? 'apns' : 'fcm', token: registration.value });
    });
    await PushNotifications.addListener('registrationError', (error) => {
      console.warn('Failed to register assignment push notifications', error);
    });
    await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
      openAssignmentInboxFromNotification(String(event.notification.data?.assignmentId || ''));
    });
  }

  const permission = await PushNotifications.checkPermissions();
  const resolved = permission.receive === 'prompt'
    ? await PushNotifications.requestPermissions()
    : permission;
  if (resolved.receive !== 'granted') return false;
  await PushNotifications.register();
  return true;
};

const notificationIdForAssignment = (assignmentId: string) => {
  let hash = 2166136261;
  for (const character of assignmentId) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (Math.abs(hash) % 2_000_000_000) + 1;
};

const isOutstandingAssignment = (assignment: ManagedAssignment) => {
  const completed = assignment.status === 'completed'
    || assignment.status === 'submitted'
    || Number(assignment.correctCount || 0) >= Math.max(1, Number(assignment.targetCorrect || 10));
  if (completed) return false;
  if (!assignment.dueAt) return true;
  const dueTime = Date.parse(assignment.dueAt);
  return Number.isNaN(dueTime) || dueTime >= Date.now();
};

export const getOutstandingAssignmentCount = (assignments: ManagedAssignment[]) =>
  assignments.filter(isOutstandingAssignment).length;

const syncNativeBadge = async (assignments: ManagedAssignment[]) => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Badge } = await import('@capawesome/capacitor-badge');
    const support = await Badge.isSupported();
    if (!support.isSupported) return;
    const count = getOutstandingAssignmentCount(assignments);
    if (count === 0) {
      // On iOS this also removes delivered notifications, so a completed final
      // assignment cannot leave a stale icon badge or notification behind.
      await Badge.clear();
    } else {
      await Badge.set({ count });
    }
  } catch (error) {
    console.warn('Failed to synchronize assignment badge', error);
  }
};

const removeCompletedAssignmentNotifications = async (assignmentId: string) => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({
      notifications: [{ id: notificationIdForAssignment(assignmentId) }],
    });
    const delivered = await LocalNotifications.getDeliveredNotifications();
    const matching = delivered.notifications.filter((notification) =>
      String(notification.extra?.assignmentId || '') === assignmentId,
    );
    if (matching.length > 0) {
      await LocalNotifications.removeDeliveredNotifications({ notifications: matching });
    }
  } catch (error) {
    console.warn('Failed to remove completed local assignment notification', error);
  }

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const delivered = await PushNotifications.getDeliveredNotifications();
    const matching = delivered.notifications.filter((notification) =>
      String(notification.data?.assignmentId || '') === assignmentId,
    );
    if (matching.length > 0) {
      await PushNotifications.removeDeliveredNotifications({ notifications: matching });
    }
  } catch (error) {
    console.warn('Failed to remove completed remote assignment notification', error);
  }
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
  async syncBadge(assignments: ManagedAssignment[]) {
    await syncNativeBadge(assignments);
  },

  async markAssignmentComplete(assignmentId: string, assignments: ManagedAssignment[]) {
    await removeCompletedAssignmentNotifications(assignmentId);
    await syncNativeBadge(assignments);
  },

  async observeAssignments(learnerId: string, assignments: ManagedAssignment[]) {
    if (typeof window === 'undefined' || !learnerId) return [];
    const assignmentIds = Array.from(new Set(assignments.map((assignment) => assignment.id).filter(Boolean)));
    const previous = readState();

    // The first observation for a learner establishes the baseline. This avoids
    // announcing every historical assignment after an app update or new link.
    if (!previous || previous.learnerId !== learnerId) {
      writeState({ learnerId, assignmentIds });
      await syncNativeBadge(assignments);
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
    await syncNativeBadge(assignments);
    return newlyDelivered.map((assignment) => assignment.id);
  },
};
