import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where, 
  getDocs,
  limit,
  updateDoc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { Nest, Squeak, Message, UserProfile, DmChannel, DmMessage, MobileSession, CustomEmoji } from './types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the database ID specified in config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Lazy-initialize Auth on demand to avoid 'Component auth has not been registered yet' during module loading
let authInstance: any = null;
export function getAuthInstance() {
  if (!authInstance) {
    try {
      authInstance = getAuth(app);
    } catch (e) {
      console.warn('Firebase Auth could not be initialized:', e);
    }
  }
  return authInstance;
}

// Helper to remove 'undefined' properties recursively so Firestore does not throw errors
export function cleanUndefined(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined);
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        cleaned[key] = cleanUndefined(val);
      }
    }
    return cleaned;
  }
  return obj;
}

// FIRESTORE ERROR HANDLING (as required by the Firebase Integration Skill)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const authObj = getAuthInstance();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: authObj?.currentUser?.uid || null,
      email: authObj?.currentUser?.email || null,
      emailVerified: authObj?.currentUser?.emailVerified || null,
      isAnonymous: authObj?.currentUser?.isAnonymous || null,
      tenantId: authObj?.currentUser?.tenantId || null,
      providerInfo: authObj?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// SEED DATA HELPER
export async function seedDatabaseIfEmpty() {
  const nestsPath = 'nests';
  try {
    const nestsRef = collection(db, nestsPath);
    const q = query(nestsRef, limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('Seeding initial data into Firestore...');
      
      // 1. Create Default Nests (Servers) - ONLY the main Comunidad Shrew, removing other clutter
      const defaultNests: Nest[] = [
        {
          id: 'nest-global',
          name: 'Comunidad Shrew',
          icon: '🐀',
          color: 'from-amber-500 to-orange-600',
          description: 'El nido principal para todos los usuarios de Shrew. ¡Squeak!',
          ownerId: 'system',
          createdAt: Date.now(),
          roles: [
            { id: 'role-admin', name: 'Administrador', color: '#ef4444', permissions: ['send_messages', 'manage_channels', 'edit_nest', 'manage_roles'] },
            { id: 'role-mod', name: 'Moderador', color: '#3b82f6', permissions: ['send_messages', 'manage_channels'] },
            { id: 'role-vip', name: 'Musaraña VIP', color: '#f59e0b', permissions: ['send_messages'] }
          ],
          memberRoles: {
            'shrew-founder': ['role-admin'],
            'shrew-helper': ['role-mod'],
          }
        }
      ];

      for (const nest of defaultNests) {
        await setDoc(doc(db, 'nests', nest.id), cleanUndefined(nest));
      }

      // 2. Create Default Squeaks (Channels) - announcements, general, and a voice room
      const defaultSqueaks: Squeak[] = [
        { id: 'squeak-anuncios', nestId: 'nest-global', name: 'anuncios', type: 'text', description: 'Canal de anuncios oficiales de la comunidad Shrew.', createdAt: Date.now() - 100000 },
        { id: 'squeak-general', nestId: 'nest-global', name: 'general', type: 'text', description: 'Canal de discusión general para todos.', createdAt: Date.now() },
        { id: 'squeak-voice-lounge', nestId: 'nest-global', name: 'Charla Acústica', type: 'voice', description: 'Entra a hablar con burbujas animadas.', createdAt: Date.now() + 1 },
      ];

      for (const squeak of defaultSqueaks) {
        await setDoc(doc(db, 'squeaks', squeak.id), cleanUndefined(squeak));
      }

      // 3. Create Welcome Messages
      const defaultMessages: Message[] = [
        {
          id: 'welcome-1',
          nestId: 'nest-global',
          squeakId: 'squeak-general',
          senderId: 'shrew-founder',
          senderName: 'SqueakMaster',
          senderColor: 'text-amber-400',
          senderAvatar: '🐀',
          content: '¡Bienvenidos a Shrew! Esta es una alternativa fresca y móvil-first para comunicarnos. ¡Espero que les encante!',
          timestamp: Date.now() - 3600000,
          reactions: { '❤️': ['system'], '🔥': ['system'] }
        },
        {
          id: 'welcome-2',
          nestId: 'nest-global',
          squeakId: 'squeak-general',
          senderId: 'shrew-helper',
          senderName: 'Musi-Musaraña',
          senderColor: 'text-rose-400',
          senderAvatar: '🐭',
          content: '¡Holi! Descubre los canales de voz (bautizados como "Echoes"). Tienen burbujas de audio interactivas y reactivas. ¡Están geniales!',
          timestamp: Date.now() - 1800000,
          reactions: { '✨': ['system'] }
        }
      ];

      for (const msg of defaultMessages) {
        await setDoc(doc(db, 'messages', msg.id), cleanUndefined(msg));
      }
      console.log('Database successfully seeded!');
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, nestsPath);
  }
}

// CUSTOM EMOJI SERVICES
export function listenToCustomEmojis(callback: (emojis: CustomEmoji[]) => void) {
  const path = 'custom_emojis';
  const emojisRef = collection(db, path);
  const q = query(emojisRef, orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: CustomEmoji[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as CustomEmoji);
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function addCustomEmoji(name: string, url: string, creatorId: string): Promise<string> {
  const path = 'custom_emojis';
  try {
    const emojisRef = collection(db, path);
    const newEmojiRef = doc(emojisRef);
    const newEmoji: CustomEmoji = {
      id: newEmojiRef.id,
      name: name.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      url,
      creatorId,
      createdAt: Date.now()
    };
    await setDoc(newEmojiRef, cleanUndefined(newEmoji));
    return newEmojiRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
}

// NEST SERVICES
export function listenToNests(callback: (nests: Nest[]) => void) {
  const path = 'nests';
  const nestsRef = collection(db, path);
  const q = query(nestsRef, orderBy('createdAt', 'asc'));
  return onSnapshot(
    q, 
    (snapshot) => {
      const nests: Nest[] = [];
      snapshot.forEach((doc) => {
        nests.push({ id: doc.id, ...doc.data() } as Nest);
      });
      callback(nests);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function updateNest(nestId: string, updates: Partial<Nest>) {
  const path = `nests/${nestId}`;
  try {
    const docRef = doc(db, 'nests', nestId);
    await updateDoc(docRef, cleanUndefined(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createNest(name: string, icon: string, color: string, description: string, ownerId: string): Promise<string> {
  const path = 'nests';
  try {
    const nestsRef = collection(db, path);
    const newNestRef = doc(nestsRef);
    const newNest: Nest = {
      id: newNestRef.id,
      name,
      icon,
      color,
      description,
      ownerId,
      createdAt: Date.now(),
      roles: [
        { id: 'role-admin', name: 'Administrador', color: '#ef4444', permissions: ['send_messages', 'manage_channels', 'edit_nest', 'manage_roles'] },
        { id: 'role-mod', name: 'Moderador', color: '#3b82f6', permissions: ['send_messages', 'manage_channels'] },
        { id: 'role-vip', name: 'Musaraña VIP', color: '#f59e0b', permissions: ['send_messages'] }
      ],
      memberRoles: {
        [ownerId]: ['role-admin']
      }
    };
    await setDoc(newNestRef, cleanUndefined(newNest));
    
    // Create a default general squeak for the new Nest
    await createSqueak(newNestRef.id, 'general', 'text', 'Canal general de discusión.');
    return newNestRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
}

// SQUEAK SERVICES (CHANNELS)
export function listenToSqueaks(nestId: string, callback: (squeaks: Squeak[]) => void) {
  const path = 'squeaks';
  const squeaksRef = collection(db, path);
  const q = query(squeaksRef, where('nestId', '==', nestId), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q, 
    (snapshot) => {
      const squeaks: Squeak[] = [];
      snapshot.forEach((doc) => {
        squeaks.push({ id: doc.id, ...doc.data() } as Squeak);
      });
      callback(squeaks);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createSqueak(nestId: string, name: string, type: 'text' | 'voice', description: string) {
  const path = 'squeaks';
  try {
    const squeaksRef = collection(db, path);
    const newSqueakRef = doc(squeaksRef);
    const newSqueak: Squeak = {
      id: newSqueakRef.id,
      nestId,
      name: name.toLowerCase().replace(/\s+/g, '-'),
      type,
      description,
      createdAt: Date.now()
    };
    await setDoc(newSqueakRef, cleanUndefined(newSqueak));
    return newSqueakRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
}

// MESSAGE SERVICES
export function listenToMessages(squeakId: string, callback: (messages: Message[]) => void) {
  const path = 'messages';
  const messagesRef = collection(db, path);
  const q = query(messagesRef, where('squeakId', '==', squeakId), orderBy('timestamp', 'asc'));
  return onSnapshot(
    q, 
    (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as Message);
      });
      callback(messages);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function sendSqueakMessage(
  nestId: string, 
  squeakId: string, 
  senderId: string, 
  senderName: string, 
  senderColor: string, 
  senderAvatar: string, 
  content: string,
  imageUrl?: string
) {
  const path = 'messages';
  try {
    const messagesRef = collection(db, path);
    const newMsgRef = doc(messagesRef);
    const newMsg: Message = {
      id: newMsgRef.id,
      nestId,
      squeakId,
      senderId,
      senderName,
      senderColor,
      senderAvatar,
      content,
      imageUrl,
      timestamp: Date.now(),
      reactions: {}
    };
    await setDoc(newMsgRef, cleanUndefined(newMsg));
    return newMsgRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
}

export async function toggleMessageReaction(messageId: string, emoji: string, userId: string) {
  const path = `messages/${messageId}`;
  try {
    const docRef = doc(db, 'messages', messageId);
    const snapshot = await getDocs(query(collection(db, 'messages'), where('id', '==', messageId)));
    if (snapshot.empty) return;
    
    const msgData = snapshot.docs[0].data() as Message;
    const reactions = msgData.reactions || {};
    const currentReactors = reactions[emoji] || [];
    
    let updatedReactors: string[];
    if (currentReactors.includes(userId)) {
      updatedReactors = currentReactors.filter(id => id !== userId);
    } else {
      updatedReactors = [...currentReactors, userId];
    }
    
    const updatedReactions = { ...reactions };
    if (updatedReactors.length === 0) {
      delete updatedReactions[emoji];
    } else {
      updatedReactions[emoji] = updatedReactors;
    }
    
    await updateDoc(docRef, { reactions: updatedReactions });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteMessage(messageId: string) {
  const path = `messages/${messageId}`;
  try {
    await deleteDoc(doc(db, 'messages', messageId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteDmMessage(messageId: string) {
  const path = `dm_messages/${messageId}`;
  try {
    await deleteDoc(doc(db, 'dm_messages', messageId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// USER PROFILES SERVICES
export async function saveUserProfileInFirestore(profile: UserProfile) {
  const path = `users/${profile.id}`;
  try {
    await setDoc(doc(db, 'users', profile.id), cleanUndefined(profile));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserProfileFromFirestore(id: string): Promise<UserProfile | null> {
  const path = `users/${id}`;
  try {
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export function listenToAllUsers(callback: (users: UserProfile[]) => void) {
  const path = 'users';
  const usersRef = collection(db, path);
  return onSnapshot(
    usersRef, 
    (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as UserProfile);
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Seed mock users
export async function seedUsersIfEmpty() {
  const path = 'users';
  try {
    const usersRef = collection(db, path);
    const q = query(usersRef, limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      const mockUsers: UserProfile[] = [
        {
          id: 'shrew-founder',
          name: 'SqueakMaster',
          username: 'squeak_founder',
          avatarColor: '#f59e0b',
          avatarIcon: '🐀',
          statusText: 'Construyendo el túnel de Shrew 🛠️',
          status: 'online',
          joinedAt: Date.now() - 1000000
        },
        {
          id: 'shrew-helper',
          name: 'Musi-Musaraña',
          username: 'musi_luna',
          avatarColor: '#ec4899',
          avatarIcon: '🐭',
          statusText: 'Escuchando música lo-fi en el nido 🎵',
          status: 'idle',
          joinedAt: Date.now() - 500000
        },
        {
          id: 'tunnel-explorer',
          name: 'TopoVeloz',
          username: 'topo_subterraneo',
          avatarColor: '#10b981',
          avatarIcon: '🐹',
          statusText: '¡Squeak! Excavando bajo tierra ������',
          status: 'dnd',
          joinedAt: Date.now() - 200000
        }
      ];
      for (const u of mockUsers) {
        await setDoc(doc(db, 'users', u.id), cleanUndefined(u));
      }
      console.log('Mock users successfully seeded!');
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// DIRECT MESSAGE SERVICES
export function listenToDmChannels(userId: string, callback: (channels: DmChannel[]) => void) {
  const path = 'dm_channels';
  const channelsRef = collection(db, path);
  const q = query(channelsRef, where('participants', 'array-contains', userId));
  return onSnapshot(
    q, 
    (snapshot) => {
      const channels: DmChannel[] = [];
      snapshot.forEach((doc) => {
        channels.push({ id: doc.id, ...doc.data() } as DmChannel);
      });
      channels.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
      callback(channels);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function getOrCreateDmChannel(userId1: string, userId2: string): Promise<string> {
  const path = 'dm_channels';
  try {
    const channelsRef = collection(db, path);
    
    // Search for an existing channel containing both users
    const q = query(channelsRef, where('participants', 'array-contains', userId1));
    const snapshot = await getDocs(q);
    
    let existingChannelId = '';
    snapshot.forEach((doc) => {
      const data = doc.data() as DmChannel;
      if (data.participants.includes(userId2)) {
        existingChannelId = doc.id;
      }
    });
    
    if (existingChannelId) {
      return existingChannelId;
    }
    
    // Create a new DM channel
    const newChannelRef = doc(channelsRef);
    const newChannel: DmChannel = {
      id: newChannelRef.id,
      participants: [userId1, userId2],
      lastMessageText: 'Conversación iniciada',
      lastMessageTimestamp: Date.now()
    };
    await setDoc(newChannelRef, cleanUndefined(newChannel));
    return newChannelRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return '';
  }
}

export function listenToDmMessages(channelId: string, callback: (messages: DmMessage[]) => void) {
  const path = 'dm_messages';
  const messagesRef = collection(db, path);
  const q = query(messagesRef, where('channelId', '==', channelId), orderBy('timestamp', 'asc'));
  return onSnapshot(
    q, 
    (snapshot) => {
      const messages: DmMessage[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as DmMessage);
      });
      callback(messages);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function sendDmMessage(
  channelId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string,
  senderColor: string,
  content: string,
  imageUrl?: string
) {
  const messagesPath = 'dm_messages';
  const channelsPath = `dm_channels/${channelId}`;
  try {
    const dmMessagesRef = collection(db, messagesPath);
    const newMsgRef = doc(dmMessagesRef);
    const newMsg: DmMessage = {
      id: newMsgRef.id,
      channelId,
      senderId,
      senderName,
      senderAvatar,
      senderColor,
      content,
      imageUrl,
      timestamp: Date.now()
    };
    await setDoc(newMsgRef, cleanUndefined(newMsg));
    
    const channelRef = doc(db, 'dm_channels', channelId);
    await updateDoc(channelRef, {
      lastMessageText: imageUrl ? '[Imagen]' : content,
      lastMessageTimestamp: Date.now()
    });
    return newMsgRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, messagesPath);
    return '';
  }
}

// MOBILE SESSIONS TRACKING
export function listenToSessions(userId: string, callback: (sessions: MobileSession[]) => void) {
  const path = 'sessions';
  const sessionsRef = collection(db, path);
  const q = query(sessionsRef, where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: MobileSession[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as MobileSession);
      });
      list.sort((a, b) => b.lastActive - a.lastActive);
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function recordMobileSession(
  userId: string,
  deviceName: string,
  os: string,
  ipAddress: string,
  location: string,
  isCurrent: boolean = false
): Promise<string> {
  const path = 'sessions';
  try {
    const sessionsRef = collection(db, path);
    const newSessionRef = doc(sessionsRef);
    const newSession: MobileSession = {
      id: newSessionRef.id,
      userId,
      deviceName,
      os,
      ipAddress,
      location,
      lastActive: Date.now(),
      isCurrent
    };
    await setDoc(newSessionRef, cleanUndefined(newSession));
    return newSessionRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return '';
  }
}

export async function ensureAnunciosChannelExists() {
  try {
    const docRef = doc(db, 'squeaks', 'squeak-anuncios');
    const qSnap = await getDocs(query(collection(db, 'squeaks'), where('id', '==', 'squeak-anuncios')));
    if (qSnap.empty) {
      console.log('Retroactively creating squeak-anuncios channel...');
      const announcementsSqueak: Squeak = {
        id: 'squeak-anuncios',
        nestId: 'nest-global',
        name: '📢-anuncios',
        type: 'text',
        description: 'Anuncios oficiales de la comunidad Shrew.',
        createdAt: Date.now() - 10000000 // force it to be first
      };
      await setDoc(docRef, cleanUndefined(announcementsSqueak));

      // Add a welcome announcement message
      const welcomeAnnMsg: Message = {
        id: 'announcement-welcome',
        nestId: 'nest-global',
        squeakId: 'squeak-anuncios',
        senderId: 'shrew-founder',
        senderName: 'SqueakMaster',
        senderColor: 'text-amber-400',
        senderAvatar: '🐀',
        content: '📢 ¡Bienvenidos al canal de anuncios oficiales de la Comunidad Shrew! Mantente al tanto de todas las novedades y actualizaciones importantes de nuestro túnel.',
        timestamp: Date.now() - 1000000,
        reactions: { '📢': ['system'], '✨': ['system'] }
      };
      await setDoc(doc(db, 'messages', welcomeAnnMsg.id), cleanUndefined(welcomeAnnMsg));
    }
  } catch (error) {
    console.error('Error ensuring anuncios channel:', error);
  }
}

export async function ensureDefaultRolesExist() {
  try {
    const globalNestRef = doc(db, 'nests', 'nest-global');
    const snap = await getDocs(query(collection(db, 'nests'), where('id', '==', 'nest-global')));
    if (!snap.empty) {
      const data = snap.docs[0].data() as Nest;
      if (!data.roles || data.roles.length === 0) {
        console.log('Retroactively adding default roles to nest-global...');
        await updateDoc(globalNestRef, {
          roles: [
            { id: 'role-admin', name: 'Administrador', color: '#ef4444', permissions: ['send_messages', 'manage_channels', 'edit_nest', 'manage_roles'] },
            { id: 'role-mod', name: 'Moderador', color: '#3b82f6', permissions: ['send_messages', 'manage_channels'] },
            { id: 'role-vip', name: 'Musaraña VIP', color: '#f59e0b', permissions: ['send_messages'] }
          ],
          memberRoles: {
            'shrew-founder': ['role-admin'],
            'shrew-helper': ['role-mod'],
          }
        });
      }
    }
  } catch (error) {
    console.error('Error ensuring default roles:', error);
  }
}

// Authentication wrappers using lazy auth instance
export async function loginWithEmail(email: string, pass: string) {
  const auth = getAuthInstance();
  if (!auth) throw new Error('Firebase Auth not available');
  return signInWithEmailAndPassword(auth, email, pass);
}

export async function signUpWithEmail(email: string, pass: string) {
  const auth = getAuthInstance();
  if (!auth) throw new Error('Firebase Auth not available');
  return createUserWithEmailAndPassword(auth, email, pass);
}

export async function loginWithGoogle() {
  const auth = getAuthInstance();
  if (!auth) throw new Error('Firebase Auth not available');
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function logoutUser() {
  const auth = getAuthInstance();
  if (!auth) throw new Error('Firebase Auth not available');
  return signOut(auth);
}
