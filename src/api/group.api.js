import client from './client';

// Mock data
const MOCK_GROUPS = [
  { id: 1, name: 'Indie Heads', description: 'For lovers of all things indie rock and pop.', members: 1234, cover: 'https://i.scdn.co/image/ab67706c0000da84b533a5a5c260256a29775933' },
  { id: 2, name: 'Hip-Hop Connoisseurs', description: 'Deep cuts, new releases, and classic hip-hop.', members: 5678, cover: 'https://i.scdn.co/image/ab67706c0000da841b18d36381c3c13a10048893' },
  { id: 3, name: 'Chillwave & Lofi', description: 'Relax, study, or just vibe.', members: 9876, cover: 'https://i.scdn.co/image/ab67706c0000da84a12f1a83a0a0379165d83a1c' },
];

const mockApi = (data) => new Promise(resolve => setTimeout(() => resolve({ data }), 400));

export const getGroupsApi = () => mockApi(MOCK_GROUPS);
export const joinGroupApi = (id) => mockApi({ success: true, message: `Joined group ${id}` });
export const getGroupPostsApi = (id) => mockApi([]); // Placeholder for group posts