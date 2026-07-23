import client from './client';

// Mock data
const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'like', user: { name: 'Charlie Puth', avatar: 'https://i.scdn.co/image/ab6761610000e5ebf09a3c3da04a439f0165c23c' }, post_id: 101, read: false, created_at: '2026-07-12T11:00:00Z' },
  { id: 2, type: 'comment', user: { name: 'Ariana Grande', avatar: 'https://i.scdn.co/image/ab6761610000e5eb7363a0b8c42830d5a2a35573' }, post_id: 101, read: false, created_at: '2026-07-12T10:30:00Z' },
  { id: 3, type: 'follow', user: { name: 'Ed Sheeran', avatar: 'https://i.scdn.co/image/ab6761610000e5eb69a21b01946aa2a112762d80' }, read: true, created_at: '2026-07-11T15:00:00Z' },
];

const mockApi = (data) => new Promise(resolve => setTimeout(() => resolve({ data }), 300));

export const getNotificationsApi = () => mockApi(MOCK_NOTIFICATIONS);
export const markNotificationAsReadApi = (id) => mockApi({ success: true, notificationId: id });
export const markAllNotificationsAsReadApi = () => mockApi({ success: true });