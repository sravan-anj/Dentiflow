import React, { useState } from 'react';
import { GoogleIcon } from '../common/GoogleIcon';
import { AuthService } from '../../utils/authService';

interface GoogleSignInButtonProps {
  onError?: (message: string) => void;
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onError,
  className = ''
}) => {
  const [isInitiating, setIsInitiating] = useState(false);

  const handleClick = async () => {
    if (isInitiating) return;
    setIsInitiating(true);

    try {
      const { error } = await AuthService.signInWithGoogle();
      if (error) {
        setIsInitiating(false);
        onError?.(error.message || 'Google sign-in could not be initiated.');
      }
      // If successful, the browser will redirect to Google's OAuth consent screen
    } catch (err: unknown) {
      setIsInitiating(false);
      const message = err instanceof Error ? err.message : 'Google authentication failed.';
      onError?.(message);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isInitiating}
      aria-label="Sign in with Google"
      title="Sign in with Google"
      className={`w-11 h-11 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:shadow-xs hover:border-[#C8B58D] hover:bg-stone-50/80 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#C8B58D]/40 focus:border-[#C8B58D] flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${className}`}
    >
      {isInitiating ? (
        <span
          className="w-5 h-5 border-2 border-[#C8B58D] border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      ) : (
        <GoogleIcon className="w-5 h-5" />
      )}
    </button>
  );
};
