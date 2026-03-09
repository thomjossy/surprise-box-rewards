// Game state management using Supabase for real-time synchronization
import { supabase } from "@/integrations/supabase/client";

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
  countryCode?: string;
  address?: string;
  boxSelected?: number;
  rewardWon?: string;
  amountWon?: number;
  registrationComplete: boolean;
  bankLinked: boolean;
  kycComplete: boolean;
  withdrawalStatus: 'pending' | 'approved' | 'rejected' | 'none';
  dateUsed: string;
  userId?: string;
}

export interface ParticipationCode {
  code: string;
  isActive: boolean;
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
export async function hasDeviceUsedCode(code: string): Promise<boolean> {
  const deviceId = getDeviceId();
  const { data, error } = await supabase
    .from('code_usage')
    .select('id')
    .eq('code', code.toUpperCase())
    .eq('device_id', deviceId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error checking code usage:', error);
    return false;
  }
  
  return !!data;
}

// Mark code as used on this device
export async function markCodeUsedOnDevice(code: string, userId?: string): Promise<void> {
  const deviceId = getDeviceId();
  const { error } = await supabase
    .from('code_usage')
    .insert([
      {
        code: code.toUpperCase(),
        device_id: deviceId,
        user_id: userId || null,
      }
    ]);
  
  if (error) {
    console.error('Error marking code as used:', error);
  }
}

// Get donation boxes from Supabase
export async function getBoxes(): Promise<DonationBox[]> {
  const { data, error } = await supabase
    .from('reward_boxes')
    .select('*')
    .order('id');
  
  if (error) {
    console.error('Error fetching boxes:', error);
    return [];
  }
  
  return data.map(box => ({
    id: box.id,
    reward: box.reward,
    amount: box.amount,
    isOpened: box.is_opened,
    openedBy: box.opened_by,
  }));
}

// Update a specific box
export async function updateBox(boxId: number, updates: Partial<DonationBox>): Promise<void> {
  const dbUpdates: any = {};
  if (updates.isOpened !== undefined) dbUpdates.is_opened = updates.isOpened;
  if (updates.openedBy !== undefined) dbUpdates.opened_by = updates.openedBy;
  if (updates.reward !== undefined) dbUpdates.reward = updates.reward;
  if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
  
  const { error } = await supabase
    .from('reward_boxes')
    .update(dbUpdates)
    .eq('id', boxId);
  
  if (error) {
    console.error('Error updating box:', error);
  }
}

// Set all boxes (admin use)
export async function setBoxes(boxes: DonationBox[]): Promise<void> {
  for (const box of boxes) {
    await updateBox(box.id, box);
  }
}

// Get participation codes from Supabase
export async function getCodes(): Promise<ParticipationCode[]> {
  const { data, error } = await supabase
    .from('participation_codes')
    .select('*')
    .order('date_created', { ascending: false });
  
  if (error) {
    console.error('Error fetching codes:', error);
    return [];
  }
  
  return data.map(code => ({
    code: code.code,
    isActive: code.is_active,
    dateCreated: code.date_created,
  }));
}

// Set participation codes (admin use)
export async function setCodes(codes: ParticipationCode[]): Promise<void> {
  // Delete all existing codes
  await supabase.from('participation_codes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  // Insert new codes
  const { error } = await supabase
    .from('participation_codes')
    .insert(codes.map(code => ({
      code: code.code,
      is_active: code.isActive,
      date_created: code.dateCreated,
    })));
  
  if (error) {
    console.error('Error setting codes:', error);
  }
}

// Validate participation code
export async function validateCode(code: string): Promise<{ valid: boolean; message: string }> {
  const codes = await getCodes();
  const found = codes.find(c => c.code.toUpperCase() === code.toUpperCase());
  
  if (!found) return { valid: false, message: 'Invalid participation code.' };
  if (!found.isActive) return { valid: false, message: 'This code has been disabled.' };
  
  const deviceUsed = await hasDeviceUsedCode(code);
  if (deviceUsed) {
    return { valid: false, message: 'This code has already been used on this device.' };
  }
  
  return { valid: true, message: 'Code accepted!' };
}

// Use a participation code
export async function useCode(code: string, userId?: string): Promise<void> {
  await markCodeUsedOnDevice(code.toUpperCase(), userId);
}

// Get current session participant from local storage (for compatibility)
export function getCurrentSession(): Participant | null {
  const deviceId = getDeviceId();
  // For now, return null as we'll handle this through Supabase queries
  return null;
}

// Set current session (for compatibility, but we'll use Supabase)
export function setCurrentSession(session: Participant): void {
  // This will be handled through Supabase operations
  console.log('Session management moved to Supabase');
}

// Get participants from Supabase
export async function getParticipants(): Promise<Participant[]> {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching participants:', error);
    return [];
  }
  
  return data.map(p => ({
    code: p.code,
    deviceId: p.device_id,
    name: p.name,
    email: p.email,
    phone: p.phone,
    countryCode: p.country_code,
    address: p.address,
    boxSelected: p.box_selected,
    rewardWon: p.reward_won,
    amountWon: p.amount_won || 0,
    registrationComplete: p.registration_complete,
    bankLinked: p.bank_linked,
    kycComplete: p.kyc_complete,
    withdrawalStatus: p.withdrawal_status as any,
    dateUsed: p.date_used,
    userId: p.user_id,
  }));
}

// Add participant to Supabase
export async function addParticipant(participant: Participant): Promise<void> {
  const { error } = await supabase
    .from('participants')
    .insert([{
      code: participant.code,
      device_id: participant.deviceId,
      name: participant.name,
      email: participant.email,
      phone: participant.phone,
      country_code: participant.countryCode,
      address: participant.address,
      box_selected: participant.boxSelected,
      reward_won: participant.rewardWon,
      amount_won: participant.amountWon || 0,
      registration_complete: participant.registrationComplete,
      bank_linked: participant.bankLinked,
      kyc_complete: participant.kycComplete,
      withdrawal_status: participant.withdrawalStatus,
      date_used: participant.dateUsed,
      user_id: participant.userId || null,
    }]);
  
  if (error) {
    console.error('Error adding participant:', error);
  }
}

// Update participant in Supabase
export async function updateParticipant(code: string, deviceId: string, updates: Partial<Participant>): Promise<void> {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.countryCode !== undefined) dbUpdates.country_code = updates.countryCode;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.boxSelected !== undefined) dbUpdates.box_selected = updates.boxSelected;
  if (updates.rewardWon !== undefined) dbUpdates.reward_won = updates.rewardWon;
  if (updates.amountWon !== undefined) dbUpdates.amount_won = updates.amountWon;
  if (updates.registrationComplete !== undefined) dbUpdates.registration_complete = updates.registrationComplete;
  if (updates.bankLinked !== undefined) dbUpdates.bank_linked = updates.bankLinked;
  if (updates.kycComplete !== undefined) dbUpdates.kyc_complete = updates.kycComplete;
  if (updates.withdrawalStatus !== undefined) dbUpdates.withdrawal_status = updates.withdrawalStatus;
  
  const { error } = await supabase
    .from('participants')
    .update(dbUpdates)
    .eq('code', code)
    .eq('device_id', deviceId);
  
  if (error) {
    console.error('Error updating participant:', error);
  }
}

// Get notification config from Supabase
export async function getNotification(): Promise<NotificationConfig> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('enabled', true)
    .single();
  
  if (error || !data) {
    return {
      enabled: true,
      title: 'Welcome to TheThankYou Rewards!',
      message: 'Enter your participation code to reveal your hidden reward. Each box contains a special prize just for you!',
    };
  }
  
  return {
    enabled: data.enabled,
    title: data.title,
    message: data.message,
  };
}

// Set notification config in Supabase
export async function setNotification(config: NotificationConfig): Promise<void> {
  // Delete existing notification and insert new one
  await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  const { error } = await supabase
    .from('notifications')
    .insert([{
      enabled: config.enabled,
      title: config.title,
      message: config.message,
    }]);
  
  if (error) {
    console.error('Error setting notification:', error);
  }
}

// Legacy localStorage functions for compatibility
export function getUserData() {
  return null; // Now handled through Supabase auth
}

export function setUserData(data: any): void {
  console.log('User data management moved to Supabase');
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

// Auth functions using Supabase
export async function registerUser(user: RegisteredUser): Promise<void> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: user.email,
    password: user.password,
  });
  
  if (authError) {
    console.error('Error registering user:', authError);
    throw authError;
  }
  
  // Add participant record
  if (authData.user) {
    await addParticipant({
      code: user.participantCode,
      deviceId: user.deviceId,
      name: user.fullName,
      email: user.email,
      phone: user.phone,
      countryCode: user.countryCode,
      boxSelected: user.boxSelected,
      rewardWon: user.rewardWon,
      amountWon: user.amountWon || 0,
      registrationComplete: user.registrationComplete,
      bankLinked: false,
      kycComplete: user.kycComplete,
      withdrawalStatus: user.withdrawalStatus,
      dateUsed: user.dateRegistered,
      userId: authData.user.id,
    });
  }
}

export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: any; message: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    return { success: false, message: error.message };
  }
  
  return { success: true, user: data.user, message: 'Login successful!' };
}

export function getLoggedInUser(): any {
  return supabase.auth.getUser();
}

export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut();
  localStorage.removeItem(STORAGE_KEYS.LOGGED_IN_USER);
}

// Subscribe to real-time updates for boxes
export function subscribeToBoxes(callback: (boxes: DonationBox[]) => void) {
  return supabase
    .channel('reward_boxes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_boxes' }, async () => {
      const boxes = await getBoxes();
      callback(boxes);
    })
    .subscribe();
}

// Subscribe to real-time updates for codes
export function subscribeToCodes(callback: (codes: ParticipationCode[]) => void) {
  return supabase
    .channel('participation_codes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'participation_codes' }, async () => {
      const codes = await getCodes();
      callback(codes);
    })
    .subscribe();
}

// Subscribe to real-time updates for notifications
export function subscribeToNotifications(callback: (notification: NotificationConfig) => void) {
  return supabase
    .channel('notifications')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, async () => {
      const notification = await getNotification();
      callback(notification);
    })
    .subscribe();
}