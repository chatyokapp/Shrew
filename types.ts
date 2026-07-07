export interface UserProfile {
  id: string;
  name: string;
  username: string; // @unique_username
  avatarColor: string;
  avatarIcon: string; // emoji icon or shortcode
  avatarUrl?: string; // base64 uploaded image or URL
  coverUrl?: string; // custom cover photo URL/base64
  statusText?: string; // custom short personal status
  status: 'online' | 'idle' | 'dnd' | 'offline';
  joinedAt: number;
  bio?: string; // biography / description of user
  blockedUsers?: string[]; // list of blocked user IDs
  friends?: string[]; // list of friend user IDs
}

export interface CustomEmoji {
  id: string;
  name: string; // e.g. "musaraña"
  url: string; // image URL or base64
  creatorId: string;
  createdAt: number;
}

export interface Role {
  id: string;
  name: string;
  color: string; // Hex color or class name
  permissions: string[]; // 'send_messages' | 'manage_channels' | 'edit_nest' | 'manage_roles'
}

export interface Nest {
  id: string;
  name: string;
  icon: string; // emoji or short code
  color: string; // Tailwind color class (gradient or solid)
  description?: string;
  ownerId: string;
  createdAt: number;
  roles?: Role[];
  memberRoles?: Record<string, string[]>; // userId -> roleIds[]
  imageUrl?: string; // custom profile picture URL or base64 data URL
  inviteCode?: string; // unique and random invitation code
}

export interface Squeak {
  id: string;
  nestId: string;
  name: string;
  type: 'text' | 'voice';
  description?: string;
  createdAt: number;
}

export interface Message {
  id: string;
  nestId: string;
  squeakId: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  senderAvatar: string; // custom url if exists, otherwise icon emoji
  content: string;
  imageUrl?: string; // added for sending images/GIFs in chats
  timestamp: number;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  isAi?: boolean;
}

export interface DmChannel {
  id: string;
  participants: string[]; // e.g. [userId1, userId2]
  lastMessageText?: string;
  lastMessageTimestamp?: number;
}

export interface DmMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderColor: string;
  content: string;
  imageUrl?: string; // added for sending images/GIFs in chats
  timestamp: number;
}

export interface VoiceParticipant {
  userId: string;
  name: string;
  avatarColor: string;
  isSpeaking: boolean;
  joinedAt: number;
  micMuted: boolean;
}

export interface MobileSession {
  id: string;
  userId: string;
  deviceName: string;
  os: string;
  ipAddress: string;
  location: string;
  lastActive: number;
  isCurrent: boolean;
}
