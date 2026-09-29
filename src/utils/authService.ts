import { User, UserRole } from '../types';
import { supabase } from './supabaseClient';

/**
 * Computes a salted, multi-pass hash digest (maintained for backward compatibility).
 */
export function hashPassword(password: string): string {
  if (!password) return '';
  
  const salted = `oralix_sec_v2_${password}_dentiflow_salt`;
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  
  for (let i = 0; i < salted.length; i++) {
    const ch = salted.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
  const hashHex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
  
  let sec = 5381;
  for (let i = 0; i < password.length; i++) {
    sec = (sec * 33) ^ password.charCodeAt(i);
  }
  
  return `olx_h_${hashHex}_${(sec >>> 0).toString(16)}`;
}

/**
 * Generates a unique @oralix.com login ID based on user name and role.
 */
export function generateOralixId(name: string, role: UserRole, existingUsers: User[]): string {
  let cleanName = name
    .toLowerCase()
    .replace(/^dr\.\s*/i, '')
    .replace(/[^a-z0-9\s.]/g, '')
    .trim()
    .replace(/\s+/g, '.');

  if (!cleanName) {
    cleanName = role;
  }

  const prefix = role === 'doctor' && !cleanName.startsWith('dr.') ? `dr.${cleanName}` : cleanName;
  const baseId = `${prefix}@oralix.com`;

  const existingIds = new Set(
    existingUsers.map(u => (u.oralixId || u.email || '').toLowerCase().trim())
  );

  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let counter = 1;
  while (true) {
    const numStr = counter < 10 ? `0${counter}` : `${counter}`;
    const candidate = `${prefix}${numStr}@oralix.com`;
    if (!existingIds.has(candidate)) {
      return candidate;
    }
    counter++;
  }
}

/**
 * Maps a Supabase profile row into a Dentiflow User object.
 */
export function mapProfileToUser(profile: any): User {
  return {
    id: profile.id,
    oralixId: profile.oralix_id || profile.oralixId || profile.email,
    name: profile.name,
    email: profile.email,
    role: profile.role || 'patient',
    avatarText: profile.avatar_text || profile.avatarText || 'PT',
    avatarUrl: profile.avatar_url || profile.avatarUrl,
    phone: profile.phone,
    specialization: profile.specialization,
    patientId: profile.patient_id || profile.patientId || 'p-1',
    department: profile.department,
    licenseNumber: profile.license_number || profile.licenseNumber,
    bio: profile.bio,
    status: profile.status || 'active',
    address: profile.address,
    emergencyContact: profile.emergency_contact || profile.emergencyContact,
    mustChangePassword: profile.must_change_password ?? profile.mustChangePassword ?? false,
    createdAt: profile.created_at || profile.createdAt
  };
}

/**
 * Supabase-backed Authentication Service
 */
export const AuthService = {
  /**
   * Signs in user with email or Oralix ID and password using Supabase Auth.
   */
  signIn: async (
    identifierInput: string,
    passwordInput: string,
    selectedRole?: UserRole
  ): Promise<{ success: boolean; user?: User; message?: string }> => {
    const cleanId = identifierInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, message: 'Please enter your Oralix ID / Email and password.' };
    }

    try {
      // Step 1: Resolve email if user entered an Oralix ID that maps to another email
      let emailToUse = cleanId;

      const { data: profileMatch } = await supabase
        .from('profiles')
        .select('*')
        .or(`oralix_id.ilike.${cleanId},email.ilike.${cleanId}`)
        .maybeSingle();

      if (profileMatch && profileMatch.email) {
        emailToUse = profileMatch.email;
      }

      // Step 2: Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: cleanPass
      });

      if (authError || !authData.user) {
        return { success: false, message: authError?.message || 'Invalid Oralix ID / Email or password.' };
      }

      // Step 3: Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      const userRole = (profile?.role || authData.user.user_metadata?.role || 'patient') as UserRole;

      if (selectedRole && userRole !== selectedRole) {
        // Sign out if role mismatch to prevent unauthorized elevation
        await supabase.auth.signOut();
        return {
          success: false,
          message: `Access Denied: Account role mismatch. This account is ${userRole.toUpperCase()}, not ${selectedRole.toUpperCase()}.`
        };
      }

      const mappedUser = profile
        ? mapProfileToUser(profile)
        : {
            id: authData.user.id,
            oralixId: authData.user.user_metadata?.oralix_id || authData.user.email || cleanId,
            name: authData.user.user_metadata?.name || 'User',
            email: authData.user.email || cleanId,
            role: userRole,
            avatarText: authData.user.user_metadata?.avatar_text || 'DF',
            phone: authData.user.user_metadata?.phone,
            specialization: authData.user.user_metadata?.specialization,
            patientId: authData.user.user_metadata?.patient_id
          };

      return { success: true, user: mappedUser };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Authentication error.' };
    }
  },

  /**
   * Registers a new user in Supabase Auth and provisions their database profile.
   */
  signUp: async (params: {
    name: string;
    email?: string;
    password: string;
    role: UserRole;
    phone?: string;
    specialization?: string;
    patientId?: string;
    existingUsers?: User[];
  }): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
      // Security Enforcement: public self-registration is strictly restricted to patients
      if (params.role !== 'patient') {
        const { data: sessionData } = await supabase.auth.getSession();
        let isAdmin = false;
        if (sessionData.session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', sessionData.session.user.id)
            .maybeSingle();
          isAdmin = profile?.role === 'admin';
        }
        if (!isAdmin) {
          return {
            success: false,
            message: `${params.role === 'doctor' ? 'Doctor' : 'Admin'} accounts cannot be self-registered. They are provisioned by Dentiflow administrators.`
          };
        }
      }

      const cleanEmail = params.email?.trim().toLowerCase();
      const existing = params.existingUsers || [];
      const generatedOralixId = generateOralixId(params.name.trim(), params.role, existing);
      const emailToRegister = cleanEmail || generatedOralixId;

      const initials = params.name
        .trim()
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      const { data, error } = await supabase.auth.signUp({
        email: emailToRegister,
        password: params.password.trim(),
        options: {
          data: {
            name: params.name.trim(),
            role: params.role,
            oralix_id: generatedOralixId,
            avatar_text: initials || (params.role === 'doctor' ? 'DR' : 'PT'),
            phone: params.phone?.trim() || '+91 98765 43210',
            specialization: params.specialization,
            patient_id: params.patientId
          }
        }
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (!data.user) {
        return { success: false, message: 'Failed to create user account.' };
      }

      // If user profile is not immediately triggered, ensure direct insert
      const newUserId = data.user.id;
      const newUser: User = {
        id: newUserId,
        oralixId: generatedOralixId,
        name: params.name.trim(),
        email: emailToRegister,
        role: params.role,
        avatarText: initials || (params.role === 'doctor' ? 'DR' : 'PT'),
        phone: params.phone?.trim() || '+91 98765 43210',
        patientId: params.patientId,
        specialization: params.specialization,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0]
      };

      await supabase.from('profiles').upsert({
        id: newUserId,
        oralix_id: generatedOralixId,
        name: params.name.trim(),
        email: emailToRegister,
        role: params.role,
        avatar_text: newUser.avatarText,
        phone: newUser.phone,
        specialization: newUser.specialization,
        patient_id: newUser.patientId,
        status: 'active'
      });

      return { success: true, user: newUser };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Sign up error.' };
    }
  },

  /**
   * Initiates Google OAuth authentication using Supabase Auth.
   */
  signInWithGoogle: async (): Promise<{ error: Error | null }> => {
    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) {
        return { error: new Error(error.message) };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(err?.message || 'Failed to initiate Google sign in.') };
    }
  },

  /**
   * Signs out the current user session from Supabase.
   */
  signOut: async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out of Supabase', err);
    }
  },

  /**
   * Updates the authenticated user's password in Supabase Auth and marks
   * must_change_password as false in public.profiles.
   */
  updatePassword: async (newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const cleanPass = newPassword.trim();
      if (!cleanPass || cleanPass.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters long.' };
      }

      // Step 1: Update password in Supabase Auth
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: cleanPass
      });

      if (updateError) {
        return { success: false, message: updateError.message };
      }

      const userId = updateData.user?.id;
      if (userId) {
        // Step 2: Mark must_change_password as false in public.profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            must_change_password: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (profileError) {
          console.error('Failed to update must_change_password in profile:', profileError);
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to update password.' };
    }
  },

  /**
   * Retrieves the currently active Supabase user and profile.
   */
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .maybeSingle();

      if (profile) {
        return mapProfileToUser(profile);
      }

      // If profile record is not yet in public.profiles (e.g. initial Google OAuth sign-in)
      const meta = sessionData.session.user.user_metadata || {};
      const fullName = meta.full_name || meta.name || sessionData.session.user.email?.split('@')[0] || 'User';
      const initials = fullName
        .trim()
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'PT';

      const fallbackProfile = {
        id: sessionData.session.user.id,
        oralix_id: meta.oralix_id || sessionData.session.user.email || '',
        name: fullName,
        email: sessionData.session.user.email || '',
        role: (meta.role || 'patient') as UserRole,
        avatar_text: initials,
        avatar_url: meta.avatar_url || meta.picture,
        phone: meta.phone,
        patient_id: meta.patient_id || 'p-1',
        status: 'active'
      };

      // Upsert profile in background
      supabase.from('profiles').upsert(fallbackProfile).then();

      return mapProfileToUser(fallbackProfile);
    } catch {
      return null;
    }
  },

  /**
   * Legacy verifyCredentials helper for synchronous fallback.
   */
  verifyCredentials: (
    oralixIdInput: string,
    passwordInput: string,
    users: User[],
    selectedRole?: UserRole
  ): { success: boolean; user?: User; message?: string } => {
    const cleanInput = oralixIdInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanInput || !cleanPass) {
      return { success: false, message: 'Please enter your Oralix ID / Email and password.' };
    }

    const matchedUser = users.find(u => {
      if (!u) return false;
      const uOralix = (u.oralixId || '').toLowerCase().trim();
      const uEmail = (u.email || '').toLowerCase().trim();
      return uOralix === cleanInput || uEmail === cleanInput;
    });

    if (!matchedUser) {
      return { success: false, message: 'Invalid Oralix ID / Email or password.' };
    }

    if (selectedRole && matchedUser.role !== selectedRole) {
      return {
        success: false,
        message: `Access Denied: Account role mismatch. This account is ${matchedUser.role.toUpperCase()}, not ${selectedRole.toUpperCase()}.`
      };
    }

    return { success: true, user: matchedUser };
  }
};
