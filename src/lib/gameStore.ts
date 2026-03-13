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
  address?: string;
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
  CURRENT_SESSION: 'tyr_current_session',
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

// Session management using localStorage
export function getCurrentSession(): Participant | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentSession(session: Participant): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
}

export function clearCurrentSession(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
}

// Check if device has used a code
export async function hasDeviceUsedCode(code: string): Promise<boolean> {
  const deviceId = getDeviceId();
  const normalizedCode = code.toUpperCase();

  const { data, error } = await supabase
    .from('code_usage')
    .select('id')
    .eq('code', normalizedCode)
    .eq('device_id', deviceId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error checking code usage:', error);
    throw error;
  }

  return !!data;
}

// Mark code as used on this device
export async function markCodeUsedOnDevice(code: string, userId?: string): Promise<void> {
  const deviceId = getDeviceId();
  const normalizedCode = code.toUpperCase();
  const { data: { user } } = await supabase.auth.getUser();
  const resolvedUserId = userId ?? user?.id ?? null;

  const { error } = await supabase
    .from('code_usage')
    .insert([{ code: normalizedCode, device_id: deviceId, user_id: resolvedUserId }]);

  if (error) {
    if (error.code === '23505') {
      throw new Error('This code has already been used on this device.');
    }
    console.error('Error marking code as used:', error);
    throw error;
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
    isOpened: box.is_opened ?? false,
    openedBy: box.opened_by ?? undefined,
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
    throw error;
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
    isActive: code.is_active ?? true,
    dateCreated: code.date_created ?? code.created_at ?? '',
  }));
}

// Add a single participation code
export async function addSingleCode(code: ParticipationCode): Promise<void> {
  const { error } = await supabase
    .from('participation_codes')
    .insert([{
      code: code.code,
      is_active: code.isActive,
      date_created: code.dateCreated,
    }]);
  
  if (error) {
    console.error('Error adding code:', error);
    throw error;
  }
}

// Add multiple participation codes
export async function addMultipleCodes(codes: ParticipationCode[]): Promise<void> {
  const { error } = await supabase
    .from('participation_codes')
    .insert(codes.map(c => ({
      code: c.code,
      is_active: c.isActive,
      date_created: c.dateCreated,
    })));
  
  if (error) {
    console.error('Error adding codes:', error);
    throw error;
  }
}

// Toggle a code's active status
export async function toggleCodeActive(code: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('participation_codes')
    .update({ is_active: isActive })
    .eq('code', code);
  
  if (error) {
    console.error('Error toggling code:', error);
    throw error;
  }
}

// Delete a participation code
export async function deleteSingleCode(code: string): Promise<void> {
  const { error } = await supabase
    .from('participation_codes')
    .delete()
    .eq('code', code);
  
  if (error) {
    console.error('Error deleting code:', error);
    throw error;
  }
}

// Legacy setCodes - kept for compatibility but prefer individual operations
export async function setCodes(codes: ParticipationCode[]): Promise<void> {
  // This is a destructive operation - delete all and reinsert
  await supabase.from('participation_codes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (codes.length > 0) {
    const { error } = await supabase
      .from('participation_codes')
      .insert(codes.map(code => ({
        code: code.code,
        is_active: code.isActive,
        date_created: code.dateCreated,
      })));
    if (error) {
      console.error('Error setting codes:', error);
      throw error;
    }
  }
}

// Validate participation code
export async function validateCode(code: string): Promise<{ valid: boolean; message: string }> {
  const normalizedCode = code.toUpperCase();
  const { data, error } = await supabase
    .from('participation_codes')
    .select('*')
    .eq('code', normalizedCode)
    .single();

  if (error || !data) return { valid: false, message: 'Invalid participation code.' };
  if (!data.is_active) return { valid: false, message: 'This code has been disabled.' };

  try {
    const deviceUsed = await hasDeviceUsedCode(normalizedCode);
    if (deviceUsed) {
      return { valid: false, message: 'This code has already been used on this device.' };
    }
  } catch {
    return { valid: false, message: 'Unable to validate this code right now. Please try again.' };
  }

  return { valid: true, message: 'Code accepted!' };
}

// Use a participation code
export async function useCode(code: string, userId?: string): Promise<void> {
  await markCodeUsedOnDevice(code.toUpperCase(), userId);
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
    name: p.name ?? undefined,
    email: p.email ?? undefined,
    phone: p.phone ?? undefined,
    countryCode: p.country_code ?? undefined,
    address: p.address ?? undefined,
    boxSelected: p.box_selected ?? undefined,
    rewardWon: p.reward_won ?? undefined,
    amountWon: p.amount_won ?? 0,
    registrationComplete: p.registration_complete ?? false,
    bankLinked: p.bank_linked ?? false,
    kycComplete: p.kyc_complete ?? false,
    withdrawalStatus: (p.withdrawal_status as any) ?? 'none',
    dateUsed: p.date_used ?? p.created_at ?? '',
    userId: p.user_id ?? undefined,
  }));
}

// Add participant to Supabase
export async function addParticipant(participant: Participant): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const resolvedUserId = participant.userId ?? user?.id ?? null;

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
      user_id: resolvedUserId,
    }]);

  if (error) {
    if (error.code === '23505') {
      await updateParticipant(participant.code, participant.deviceId, { ...participant, userId: resolvedUserId });
      return;
    }
    console.error('Error adding participant:', error);
    throw error;
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
  if (updates.dateUsed !== undefined) dbUpdates.date_used = updates.dateUsed;
  if (updates.userId !== undefined) dbUpdates.user_id = updates.userId;

  const { data, error } = await supabase
    .from('participants')
    .update(dbUpdates)
    .eq('code', code)
    .eq('device_id', deviceId)
    .select('id');

  if (error) {
    console.error('Error updating participant:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    const { data: { user } } = await supabase.auth.getUser();
    const fallbackUserId = updates.userId ?? user?.id ?? null;

    const { error: insertError } = await supabase
      .from('participants')
      .insert([{
        code,
        device_id: deviceId,
        name: updates.name ?? null,
        email: updates.email ?? null,
        phone: updates.phone ?? null,
        country_code: updates.countryCode ?? null,
        address: updates.address ?? null,
        box_selected: updates.boxSelected ?? null,
        reward_won: updates.rewardWon ?? null,
        amount_won: updates.amountWon ?? 0,
        registration_complete: updates.registrationComplete ?? false,
        bank_linked: updates.bankLinked ?? false,
        kyc_complete: updates.kycComplete ?? false,
        withdrawal_status: updates.withdrawalStatus ?? 'none',
        date_used: updates.dateUsed ?? new Date().toISOString(),
        user_id: fallbackUserId,
      }]);

    if (insertError) {
      console.error('Error creating participant during update fallback:', insertError);
      throw insertError;
    }
  }
}

// Get participant by user_id
export async function getParticipantByUserId(userId: string): Promise<Participant | null> {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error || !data) return null;
  
  return {
    code: data.code,
    deviceId: data.device_id,
    name: data.name ?? undefined,
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
    countryCode: data.country_code ?? undefined,
    address: data.address ?? undefined,
    boxSelected: data.box_selected ?? undefined,
    rewardWon: data.reward_won ?? undefined,
    amountWon: data.amount_won ?? 0,
    registrationComplete: data.registration_complete ?? false,
    bankLinked: data.bank_linked ?? false,
    kycComplete: data.kyc_complete ?? false,
    withdrawalStatus: (data.withdrawal_status as any) ?? 'none',
    dateUsed: data.date_used ?? data.created_at ?? '',
    userId: data.user_id ?? undefined,
  };
}

// Get notification config from Supabase
export async function getNotification(): Promise<NotificationConfig> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('enabled', true)
    .limit(1)
    .maybeSingle();
  
  if (error || !data) {
    return {
      enabled: true,
      title: 'Welcome to TheThankYou Rewards!',
      message: 'Enter your participation code to reveal your hidden reward. Each box contains a special prize just for you!',
    };
  }
  
  return {
    enabled: data.enabled ?? true,
    title: data.title,
    message: data.message,
  };
}

// Set notification config in Supabase
export async function setNotification(config: NotificationConfig): Promise<void> {
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
    throw error;
  }
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

  // Update the existing participant record with user_id
  if (authData.user) {
    await updateParticipant(user.participantCode, user.deviceId, {
      name: user.fullName,
      email: user.email,
      phone: `${user.countryCode}${user.phone}`,
      countryCode: user.countryCode,
      address: user.address,
      registrationComplete: user.registrationComplete,
      kycComplete: user.kycComplete,
      withdrawalStatus: user.withdrawalStatus,
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
  
  // Fetch participant data for this user
  const participant = await getParticipantByUserId(data.user.id);
  
  return { success: true, user: { ...data.user, participant }, message: 'Login successful!' };
}

export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut();
  clearCurrentSession();
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
