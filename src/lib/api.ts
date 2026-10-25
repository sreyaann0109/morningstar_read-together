import { PursuitPlan, SharingPost, UserProfile, AppNotification, SiteSettings } from '../types';

let activeMutationsCount = 0;
let lastMutationTimestamp = 0;

export function markMutationStart() {
  activeMutationsCount += 1;
  lastMutationTimestamp = Date.now();
}

export function markMutationEnd() {
  activeMutationsCount = Math.max(0, activeMutationsCount - 1);
  lastMutationTimestamp = Date.now();
}

export function isMutatingOrInCooldown(cooldownMs = 4000): boolean {
  if (activeMutationsCount > 0) return true;
  if (Date.now() - lastMutationTimestamp < cooldownMs) return true;
  return false;
}

export function getLastMutationTimestamp(): number {
  return lastMutationTimestamp;
}

export async function fetchInitialDataFromBackend(): Promise<{
  plans?: PursuitPlan[];
  posts?: SharingPost[];
  users?: UserProfile[];
  notifications?: AppNotification[];
  siteSettings?: SiteSettings;
} | null> {
  try {
    const res = await fetch('/api/data', { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success) {
      return {
        plans: json.plans,
        posts: json.posts,
        users: json.users,
        notifications: json.notifications,
        siteSettings: json.siteSettings,
      };
    }
  } catch (e) {
    console.warn('Backend API not reachable, falling back to localStorage');
  }
  return null;
}

class SyncQueue<T> {
  private inFlight = false;
  private pending: T | null = null;
  private syncFn: (data: T) => Promise<any>;

  constructor(syncFn: (data: T) => Promise<any>) {
    this.syncFn = syncFn;
  }

  async enqueue(data: T): Promise<void> {
    this.pending = data;
    lastMutationTimestamp = Date.now();
    if (this.inFlight) return;
    this.inFlight = true;
    markMutationStart();
    try {
      while (this.pending !== null) {
        const current = this.pending;
        this.pending = null;
        try {
          await this.syncFn(current);
        } catch (e) {
          console.error('SyncQueue error:', e);
        }
      }
    } finally {
      this.inFlight = false;
      markMutationEnd();
    }
  }
}

const rawSyncPlans = async (plans: PursuitPlan[]) => {
  try {
    await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plans),
    });
  } catch (e) {}
};

const plansQueue = new SyncQueue(rawSyncPlans);

export async function syncPlansToBackend(plans: PursuitPlan[]) {
  return plansQueue.enqueue(plans);
}

export async function deletePlanFromBackend(planId: string) {
  markMutationStart();
  try {
    await fetch(`/api/plans?id=${encodeURIComponent(planId)}`, {
      method: 'DELETE',
    });
  } catch (e) {
  } finally {
    markMutationEnd();
  }
}

const rawSyncPosts = async (posts: SharingPost[]) => {
  try {
    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(posts),
    });
  } catch (e) {}
};

const postsQueue = new SyncQueue(rawSyncPosts);

export async function syncPostsToBackend(posts: SharingPost[]) {
  return postsQueue.enqueue(posts);
}

export async function deletePostFromBackend(postId: string) {
  markMutationStart();
  try {
    await fetch(`/api/posts?id=${encodeURIComponent(postId)}`, {
      method: 'DELETE',
    });
  } catch (e) {
  } finally {
    markMutationEnd();
  }
}

const rawSyncUsers = async (users: UserProfile[]) => {
  markMutationStart();
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users),
    });
    if (!res.ok) {
      console.error('Failed to sync users to backend:', await res.text());
    }
  } catch (e) {
    console.error('Network error syncing users to backend:', e);
  } finally {
    markMutationEnd();
  }
};

const usersQueue = new SyncQueue(rawSyncUsers);

export async function syncUsersToBackend(users: UserProfile[]) {
  return usersQueue.enqueue(users);
}

export async function deleteUserFromBackend(userId: string) {
  markMutationStart();
  try {
    await fetch(`/api/users?id=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  } catch (e) {
  } finally {
    markMutationEnd();
  }
}

const rawSyncNotifications = async (notifications: AppNotification[]) => {
  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notifications),
    });
  } catch (e) {}
};

const notificationsQueue = new SyncQueue(rawSyncNotifications);

export async function syncNotificationsToBackend(notifications: AppNotification[]) {
  return notificationsQueue.enqueue(notifications);
}

export async function clearNotificationsFromBackend(recipientUserId?: string) {
  markMutationStart();
  try {
    const url = recipientUserId
      ? `/api/notifications?recipientUserId=${encodeURIComponent(recipientUserId)}`
      : '/api/notifications';
    await fetch(url, {
      method: 'DELETE',
    });
  } catch (e) {
  } finally {
    markMutationEnd();
  }
}

export async function fetchSiteSettingsFromBackend() {
  try {
    const res = await fetch('/api/settings', { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.settings) {
      return json.settings;
    }
  } catch (e) {}
  return null;
}

const rawSyncSettings = async (settings: any) => {
  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  } catch (e) {}
};

const settingsQueue = new SyncQueue(rawSyncSettings);

export async function syncSettingsToBackend(settings: any) {
  return settingsQueue.enqueue(settings);
}
