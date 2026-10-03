import React, { useEffect, useState } from 'react';
import { ToothIcon } from '../common/ToothIcon';
import type { User } from '../../types';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { AuthService } from '../../utils/authService';
import { supabase } from '../../utils/supabaseClient';
import { AlertCircle, ArrowLeft } from 'lucide-react';

interface AuthCallbackProps {
  onSuccess: (user: User) => void;
  onNavigateSignIn: () => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({
  onSuccess,
  onNavigateSignIn,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    'Verifying Google credentials with Supabase Auth...'
  );

  useEffect(() => {
    let isMounted = true;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let isProcessing = false;

    const processSession = async (sessionUser: {
      id: string;
      email?: string;
      user_metadata?: Record<string, unknown>;
      [key: string]: unknown;
    }) => {
      if (!isMounted || isProcessing) {
        return;
      }

      isProcessing = true;

      try {
        setStatusMessage('Syncing patient chart and medical records...');

        const patientUser = await AuthService.syncGoogleUser(sessionUser);

        if (!isMounted) {
          return;
        }

        try {
          window.history.replaceState(null, '', '/patient');
        } catch (historyError) {
          console.warn(
            'Unable to clean OAuth callback URL:',
            historyError
          );
        }

        onSuccess(patientUser);
      } catch (err: unknown) {
        console.error(
          'Failed to process OAuth session in /auth/callback:',
          err
        );

        if (!isMounted) {
          return;
        }

        const message =
          err instanceof Error
            ? err.message
            : 'Failed to link Google account to patient record.';

        setError(message);
        isProcessing = false;
      }
    };

    const checkForOAuthError = (): boolean => {
      if (typeof window === 'undefined') {
        return false;
      }

      const hash = window.location.hash || '';
      const search = window.location.search || '';

      let rawParams = '';

      if (hash.startsWith('#')) {
        rawParams = hash.substring(1);
      } else if (search.startsWith('?')) {
        rawParams = search.substring(1);
      }

      if (!rawParams) {
        return false;
      }

      const params = new URLSearchParams(rawParams);
      const oauthError = params.get('error');

      if (!oauthError) {
        return false;
      }

      const errorDescription =
        params.get('error_description') ||
        oauthError ||
        'Google authentication was declined or expired.';

      if (isMounted) {
        setError(errorDescription.replace(/\+/g, ' '));
      }

      return true;
    };

    // Check for OAuth provider errors before starting session processing.
    if (checkForOAuthError()) {
      return () => {
        isMounted = false;

        if (retryTimeout) {
          clearTimeout(retryTimeout);
        }
      };
    }

    // Listen for Supabase authentication state changes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === 'SIGNED_IN' ||
        event === 'INITIAL_SESSION' ||
        event === 'TOKEN_REFRESHED'
      ) {
        if (session?.user) {
          void processSession(session.user);
        }
      }
    });

    // Check whether Supabase already has an active session.
    const checkExistingSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        if (session?.user) {
          await processSession(session.user);
          return;
        }

        // Supabase may still be processing the OAuth callback.
        retryTimeout = setTimeout(async () => {
          if (!isMounted || isProcessing) {
            return;
          }

          try {
            const {
              data: { session: retrySession },
              error: retryError,
            } = await supabase.auth.getSession();

            if (!isMounted) {
              return;
            }

            if (retryError) {
              setError(retryError.message);
              return;
            }

            if (retrySession?.user) {
              await processSession(retrySession.user);
            } else {
              setError(
                'No authenticated Supabase session was detected in the callback URL.'
              );
            }
          } catch (retryErr: unknown) {
            if (!isMounted) {
              return;
            }

            const message =
              retryErr instanceof Error
                ? retryErr.message
                : 'Unable to verify the Supabase authentication session.';

            setError(message);
          }
        }, 1500);
      } catch (err: unknown) {
        if (!isMounted) {
          return;
        }

        const message =
          err instanceof Error
            ? err.message
            : 'Unable to verify the Supabase authentication session.';

        setError(message);
      }
    };

    void checkExistingSession();

    return () => {
      isMounted = false;

      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }

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

          <h2 className="text-lg font-extrabold text-[#252525] mb-2">
            Authentication Failed
          </h2>

          <p className="text-xs text-[#6F6D69] mb-6 leading-relaxed">
            {error}
          </p>

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

        <h2 className="text-base font-extrabold text-[#252525]">
          Completing Authentication
        </h2>

        <p className="text-xs text-[#6F6D69] mt-1.5 leading-relaxed">
          {statusMessage}
        </p>
      </div>
    </div>
  );
};
