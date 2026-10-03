import React, { useEffect, useState } from 'react';
import { ToothIcon } from '../common/ToothIcon';
import { User } from '../../types';
import { AuthService } from '../../utils/authService';
import { supabase } from '../../utils/supabaseClient';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

interface AuthCallbackProps {
  onSuccess: (user: User) => void;
  onNavigateSignIn: () => void;
}

/**
 * Dedicated OAuth Callback Route Component (/auth/callback).
 * 
 * WHY /auth/callback EXISTS:
 * When authenticating via Google OAuth with Supabase Auth, the OAuth provider redirects the browser
 * back to the application URL with authentication tokens (either in the URL hash fragment
 * #access_token=... or code=... in PKCE mode).
 * 
 * Having a dedicated /auth/callback route:
 * 1. Isolates OAuth session handling from the regular /login view.
 * 2. Prevents the application router from mistaking an OAuth redirect for an unauthenticated user on /login.
 * 3. Allows Supabase's browser client to parse the session, verify the token, and fire onAuthStateChange.
 * 4. Ensures we can securely bridge the Supabase user to an application Patient before rendering the portal.
 */
export const AuthCallback: React.FC<AuthCallbackProps> = ({ onSuccess, onNavigateSignIn }) => {
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Verifying Google credentials with Supabase Auth...');

  useEffect(() => {
    let isMounted = true;

    // 1. Check for explicit error parameters in URL hash or query string
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('error=') || search.includes('error=')) {
        const rawParams = hash.startsWith('#') ? hash.substring(1) : search.startsWith('?') ? search.substring(1) : '';
        const params = new URLSearchParams(rawParams);
        const errorDesc = params.get('error_description') || params.get('error') || 'Google authentication was declined or expired.';
        if (isMounted) {
          setError(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
        }
        return;
      }
    }

    const processSession = async () => {
      try {
        if (!isMounted) return;
        setStatusMessage('Syncing patient chart and medical records...');

        // Bridge Supabase user -> Dentiflow Patient User
        const patientUser = await AuthService.getCurrentUser();
        if (!patientUser) {
          throw new Error('No authenticated user profile was found.');
        }

        if (isMounted) {
          // Clean the OAuth tokens and URL hash from browser history
          if (typeof window !== 'undefined') {
            try {
              window.history.replaceState(null, '', '/patient');
            } catch (_) {}
          }
          onSuccess(patientUser);
        }
      } catch (err: any) {
        console.error('Failed to process OAuth session in /auth/callback:', err);
        if (isMounted) {
          setError(err?.message || 'Failed to link Google account to patient record.');
        }
      }
    };

    // 2. Listen to Supabase onAuthStateChange for SIGNED_IN event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          await processSession();
        }
      }
    });

    // 3. Inspect existing session via getSession() in case the tokens were already parsed
    supabase.auth.getSession().then(async ({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        if (isMounted) setError(sessionError.message);
        return;
      }

      if (session?.user) {
        await processSession();
      } else {
        // Give Supabase client a brief moment to finish URL fragment parsing
        const timeout = setTimeout(() => {
          if (isMounted && !error) {
            supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
              if (retrySession?.user) {
                processSession();
              } else if (isMounted) {
                setError('No authenticated Supabase session was detected in the callback URL.');
              }
            });
          }
        }, 1500);

        return () => clearTimeout(timeout);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [onSuccess]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex flex-col items-center justify-center p-4 font-sans text-[#252525]">
        <div className="w-full max-w-md bg-white border border-stone-200/80 rounded-3xl p-7 shadow-lg text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#B97870]/15 text-[#9B4D45] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-[#252525] mb-2">Authentication Failed</h2>
          <p className="text-xs text-[#6F6D69] mb-6 leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={onNavigateSignIn}
            className="w-full py-2.5 px-4 rounded-xl bg-[#252525] hover:bg-[#383838] text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#C8B58D]" />
            <span>Return to Sign In</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] flex flex-col items-center justify-center p-4 font-sans text-[#252525]">
      <div className="w-full max-w-md bg-white/90 border border-stone-200/80 rounded-3xl p-8 shadow-[0_18px_55px_rgba(60,55,45,0.08)] backdrop-blur-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#EDE8DE] border border-[#C8B58D]/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <ToothIcon size={24} />
        </div>
        <div className="w-6 h-6 border-3 border-[#C8B58D] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <h2 className="text-base font-extrabold text-[#252525]">Completing Authentication</h2>
        <p className="text-xs text-[#6F6D69] mt-1.5 leading-relaxed">{statusMessage}</p>
      </div>
    </div>
  );
};
