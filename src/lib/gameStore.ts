// Game state management using localStorage for device fingerprinting

export interface DonationBox {
  id: number;
  reward: string;
  amount: number;
  isOpened: boolean;
  openedBy?: string;
}

export interface Participant {
  code: string;
  deviceId: string;
  name?: string;
  email?: string;
  phone?: string;
  boxSelected?: number;
  rewardWon?: string;
  amountWon?: number;
  registrationComplete: boolean;
  bankLinked: boolean;
  kycComplete: boolean;
  withdrawalStatus: 'pending' | 'approved' | 'rejected' | 'none';
  dateUsed: string;
}

export interface ParticipationCode {
  code: string;
  isActive: boolean;
  usedBy: string[];
  devicesUsed: string[];
  dateCreated: string;
}

export interface NotificationConfig {
  enabled: boolean;
  message: string;
  title: string;
}

export interface RegisteredUser {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  countryCode: string;
  participantCode: string;
  deviceId: string;
  boxSelected?: number;
  rewardWon?: string;
  amountWon?: number;
  registrationComplete: boolean;
  kycComplete: boolean;
  withdrawalStatus: 'pending' | 'approved' | 'rejected' | 'none';
  dateRegistered: string;
}

const STORAGE_KEYS = {
  DEVICE_ID: 'tyr_device_id',
  USED_CODES: 'tyr_used_codes',
  CURRENT_SESSION: 'tyr_current_session',
  BOXES: 'tyr_boxes',
  CODES: 'tyr_codes',
  PARTICIPANTS: 'tyr_participants',
  NOTIFICATION: 'tyr_notification',
  USER_DATA: 'tyr_user_data',
  REGISTERED_USERS: 'tyr_registered_users',
  LOGGED_IN_USER: 'tyr_logged_in_user',
};

// Generate a device fingerprint
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}

// Check if device has used a code
export function hasDeviceUsedCode(code: string): boolean {
  const usedCodes: Record<string, boolean> = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.USED_CODES) || '{}'
  );
  return !!usedCodes[code];
}

// Mark code as used on this device
export function markCodeUsedOnDevice(code: string): void {
  const usedCodes: Record<string, boolean> = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.USED_CODES) || '{}'
  );
  usedCodes[code] = true;
  localStorage.setItem(STORAGE_KEYS.USED_CODES, JSON.stringify(usedCodes));
}

// Default donation boxes
function getDefaultBoxes(): DonationBox[] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    reward: `Reward ${i + 1}`,
    amount: [50, 100, 150, 200, 250, 500, 750, 1000, 75, 125, 300, 450][i],
    isOpened: false,
  }));
}

// Default participation codes
function getDefaultCodes(): ParticipationCode[] {
  return [
    { code: 'THANKYOU2024', isActive: true, usedBy: [], devicesUsed: [], dateCreated: new Date().toISOString() },
    { code: 'REWARD100', isActive: true, usedBy: [], devicesUsed: [], dateCreated: new Date().toISOString() },
    { code: 'GIFT500', isActive: true, usedBy: [], devicesUsed: [], dateCreated: new Date().toISOString() },
    { code: 'BONUS2024', isActive: true, usedBy: [], devicesUsed: [], dateCreated: new Date().toISOString() },
    { code: 'WIN50K', isActive: true, usedBy: [], devicesUsed: [], dateCreated: new Date().toISOString() },
  ];
}

export function getBoxes(): DonationBox[] {
  const stored = localStorage.getItem(STORAGE_KEYS.BOXES);
  if (!stored) {
    const boxes = getDefaultBoxes();
    localStorage.setItem(STORAGE_KEYS.BOXES, JSON.stringify(boxes));
    return boxes;
  }
  return JSON.parse(stored);
}

export function updateBox(boxId: number, updates: Partial<DonationBox>): void {
  const boxes = getBoxes();
  const idx = boxes.findIndex(b => b.id === boxId);
  if (idx !== -1) {
    boxes[idx] = { ...boxes[idx], ...updates };
    localStorage.setItem(STORAGE_KEYS.BOXES, JSON.stringify(boxes));
  }
}

export function setBoxes(boxes: DonationBox[]): void {
  localStorage.setItem(STORAGE_KEYS.BOXES, JSON.stringify(boxes));
}

export function getCodes(): ParticipationCode[] {
  const stored = localStorage.getItem(STORAGE_KEYS.CODES);
  if (!stored) {
    const codes = getDefaultCodes();
    localStorage.setItem(STORAGE_KEYS.CODES, JSON.stringify(codes));
    return codes;
  }
  return JSON.parse(stored);
}

export function setCodes(codes: ParticipationCode[]): void {
  localStorage.setItem(STORAGE_KEYS.CODES, JSON.stringify(codes));
}

export function validateCode(code: string): { valid: boolean; message: string } {
  const codes = getCodes();
  const found = codes.find(c => c.code.toUpperCase() === code.toUpperCase());
  
  if (!found) return { valid: false, message: 'Invalid participation code.' };
  if (!found.isActive) return { valid: false, message: 'This code has been disabled.' };
  
  const deviceId = getDeviceId();
  if (found.devicesUsed.includes(deviceId)) {
    return { valid: false, message: 'This code has already been used on this device.' };
  }
  
  return { valid: true, message: 'Code accepted!' };
}

export function useCode(code: string): void {
  const codes = getCodes();
  const deviceId = getDeviceId();
  const idx = codes.findIndex(c => c.code.toUpperCase() === code.toUpperCase());
  if (idx !== -1) {
    codes[idx].devicesUsed.push(deviceId);
    setCodes(codes);
  }
  markCodeUsedOnDevice(code.toUpperCase());
}

export function getCurrentSession(): Participant | null {
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
  return stored ? JSON.parse(stored) : null;
}

export function setCurrentSession(session: Participant): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
}

export function getParticipants(): Participant[] {
  const stored = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
  return stored ? JSON.parse(stored) : [];
}

export function addParticipant(participant: Participant): void {
  const participants = getParticipants();
  participants.push(participant);
  localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(participants));
}

export function updateParticipant(code: string, deviceId: string, updates: Partial<Participant>): void {
  const participants = getParticipants();
  const idx = participants.findIndex(p => p.code === code && p.deviceId === deviceId);
  if (idx !== -1) {
    participants[idx] = { ...participants[idx], ...updates };
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(participants));
  }
}

export function getNotification(): NotificationConfig {
  const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATION);
  return stored ? JSON.parse(stored) : {
    enabled: true,
    title: 'Welcome to TheThankYou Rewards!',
    message: 'Enter your participation code to reveal your hidden reward. Each box contains a special prize just for you!',
  };
}

export function setNotification(config: NotificationConfig): void {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATION, JSON.stringify(config));
}

export function getUserData() {
  const stored = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  return stored ? JSON.parse(stored) : null;
}

export function setUserData(data: any): void {
  localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

// Registered users management
export function getRegisteredUsers(): RegisteredUser[] {
  const stored = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
  return stored ? JSON.parse(stored) : [];
}

export function registerUser(user: RegisteredUser): void {
  const users = getRegisteredUsers();
  // Update if exists, otherwise add
  const idx = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
  if (idx !== -1) {
    users[idx] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
}

export function loginUser(email: string, password: string): { success: boolean; user?: RegisteredUser; message: string } {
  const users = getRegisteredUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return { success: false, message: 'No account found with this email.' };
  if (user.password !== password) return { success: false, message: 'Incorrect password.' };
  localStorage.setItem(STORAGE_KEYS.LOGGED_IN_USER, JSON.stringify(user));
  return { success: true, user, message: 'Login successful!' };
}

export function getLoggedInUser(): RegisteredUser | null {
  const stored = localStorage.getItem(STORAGE_KEYS.LOGGED_IN_USER);
  return stored ? JSON.parse(stored) : null;
}

export function logoutUser(): void {
  localStorage.removeItem(STORAGE_KEYS.LOGGED_IN_USER);
}
