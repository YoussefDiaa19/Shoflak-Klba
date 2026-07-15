
import React, { useState, useMemo, useEffect } from 'react';
import { Owner } from '../types';
import { CITIES_DATA } from '../data';
import { translations } from '../translations';
import { supabase } from '../supabase';
import { openExternalLink } from '../navUtils';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Mail, Lock, LogIn, Eye, EyeOff, User, Check, X, ArrowRight, Phone, Globe, MapPin, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: Owner) => void;
  existingOwners: Owner[];
  onBack?: () => void;
  isInline?: boolean;
  externalError?: string | null;
}

import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import { Browser } from '@capacitor/browser';

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, existingOwners, onBack, isInline = false, externalError = null }) => {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const t = translations[lang];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIframe, setIsIframe] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (externalError) {
      setLoginError(externalError);
      setIsSubmitting(false);
    }
  }, [externalError]);


  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_SUCCESS') {
        // App.tsx handles the actual session sync globally
        setIsSubmitting(false);
      } else if (event.data?.type === 'OAUTH_ERROR') {
        console.error("OAuth error message received from popup:", event.data.error);
        if (event.data.error === "Database error saving new user") {
          setLoginError("Database error: Your Supabase user creation trigger failed. Check your Supabase Postgres Database Logs to fix the issue.");
        } else {
          setLoginError(event.data.error);
        }
        setIsSubmitting(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    try {
      const framed = window.self !== window.top;
      setIsIframe(framed);
      
      const native = Capacitor.isNativePlatform();
      setIsNative(native);

      if (native && GoogleAuth) {
        GoogleAuth.initialize();
      }
    } catch (e) {
      console.error("Platform initialization error:", e);
      setIsIframe(true);
    }
  }, []);

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setIsSubmitting(true);
    setLoginError('');
    
    // Web Apple SignIn usually handled by Supabase
    // Using standard Supabase OAuth flow for both web and mobile unless specific Capacitor plugin is added later

    // NATIVE APPLE LOGIN (Only on iOS natively)
    if (provider === 'apple' && isNative && Capacitor.getPlatform() === 'ios') {
      try {
        console.log("Triggering native Apple sign in...");
        const result = await SignInWithApple.authorize({
          clientId: 'com.shoflakklba.app', // Correct native Bundle ID on iOS (NOT the Services ID)
          redirectURI: 'https://pgkbzeixrtcehbfemsqe.supabase.co/auth/v1/callback',
          scopes: 'email name',
        });

        if (result.response && result.response.identityToken) {
          console.log("Native Apple sign in success! Exchanging token with Supabase...");
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'apple',
            token: result.response.identityToken
          });
          if (error) throw error;
          if (data?.user) {
            console.log("Supabase exchange success for native Apple login!");
            setIsSubmitting(false);
            return;
          }
        } else {
          throw new Error("No Identity Token received from Apple native login");
        }
      } catch (err: any) {
        console.warn("Native Apple Login failed with error details:", err);
        // Do not return here, fall through to web flow if native fails
      }
    }

    // NATIVE GOOGLE LOGIN (Android/iOS only, and if plugin loaded)
    if (provider === 'google' && isNative && GoogleAuth) {
      try {
        console.log("Triggering native Google sign in...");
        const user = await GoogleAuth.signIn();
        if (user?.authentication?.idToken) {
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: user.authentication.idToken
          });
          if (error) throw error;
          if (data?.user) {
            setIsSubmitting(false);
            return;
          }
        } else {
          throw new Error("No ID Token received from native login");
        }
      } catch (err: any) {
        console.error("Native Google Login failed, falling back to web OAuth:", err);
        // Do not return here, fall through to web flow if native fails
      }
    }

    // WEB / FALLBACK FLOW
    let redirectTo = '';
    const baseOrigin = window.location.origin.endsWith('/') ? window.location.origin.slice(0, -1) : window.location.origin;
    
    if (isNative) {
      // On native mobile platforms, Supabase handles the provider's HTTPS redirect 
      // and then redirects to our app's custom scheme.
      redirectTo = 'com.shoflakklba.app://auth/callback';
    } else {
      redirectTo = `${baseOrigin}/auth/callback`;
    }
    
    console.log("Initiating OAuth login with redirect to:", redirectTo);
    console.log("Make sure this URL is in your Supabase Redirect URLs list!");

    try {
      const queryParams: Record<string, string> = {};
      if (provider === 'google') {
        queryParams.prompt = 'select_account';
        queryParams.access_type = 'offline';
      }

      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { 
          redirectTo,
          skipBrowserRedirect: true,
          scopes: provider === 'apple' ? 'name email' : 'email profile openid',
          queryParams
        }
      });

      if (authError) throw authError;

      if (data?.url) {
        if (isNative) {
          await Browser.open({ url: data.url });
        } else if (isIframe) {
          const popup = window.open(data.url, '_blank');
          if (!popup || popup.closed) {
            setLoginError("Popup blocked! Click the 'Open Clean App Tab' button below.");
            setIsSubmitting(false);
          }
        } else {
          window.location.href = data.url;
        }
      }

    } catch (err: any) {
      setLoginError("Social login failed.");
      setIsSubmitting(false);
    }
  };

  const GoogleLogo = () => (
    <svg viewBox="0 0 48 48" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );

  const AppleLogo = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.05,20.28c-0.96,1.39-1.96,2.77-3.48,2.79c-1.48,0.02-1.96-0.89-3.66-0.89c-1.69,0-2.22,0.87-3.64,0.92 c-1.48,0.05-2.64-1.51-3.6-2.9c-1.96-2.84-3.46-8.03-1.44-11.52c1-1.74,2.79-2.85,4.73-2.88c1.48-0.03,2.88,1,3.79,1 c0.9,0,2.6-1.24,4.39-1.06c0.75,0.03,2.86,0.3,4.22,2.29c-0.11,0.07-2.52,1.47-2.49,4.4c0.04,3.5,2.88,4.66,2.91,4.68 C18.73,17.48,17.97,18.96,17.05,20.28z M14.39,4.01c0.78-0.93,1.3-2.24,1.15-3.53c-1.12,0.05-2.47,0.74-3.27,1.67 c-0.72,0.82-1.35,2.15-1.18,3.39C12.33,5.6,13.59,4.96,14.39,4.01z"/>
    </svg>
  );

  return (
    <div className={`flex flex-col justify-center px-6 ${isInline ? 'py-16 min-h-[550px]' : 'py-10 min-h-screen'} bg-white dark:bg-[#1a1a1a] relative animate-in fade-in duration-500`}>
      {onBack && !isInline && (
        <button 
          onClick={onBack}
          className="absolute top-6 right-6 p-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-full shadow-sm border border-gray-200 dark:border-zinc-700 active:scale-90 transition-transform z-10"
        >
          <X size={20} />
        </button>
      )}

      <button 
        onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
        className="absolute top-6 left-6 px-4 py-2 bg-gray-100 dark:bg-zinc-800 rounded-full text-xs font-bold text-gray-600 dark:text-gray-400 shadow-sm border border-gray-200 dark:border-zinc-700 active:scale-95 transition-all z-10"
      >
        {lang === 'en' ? 'العربية' : 'English'}
      </button>

      <div className="space-y-8 max-w-sm mx-auto w-full pt-6">
        <div className="flex flex-col items-center text-center space-y-3 relative">
          <img 
            src="shoflak-klba-light.png" 
            alt="Shoflak Klba" 
            className="w-40 h-auto block dark:hidden" 
          />
          <img 
            src="shoflak-klba-dark.png" 
            alt="Shoflak Klba" 
            className="w-40 h-auto hidden dark:block" 
          />
          <div className="space-y-1">
            <p className="text-gray-500 dark:text-gray-400 font-bold text-sm leading-snug px-4">
              {t.loginSlogan || "Find the perfect partner for your pet"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700" />
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">{t.orContinue}</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700" />
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => handleSocialLogin('google')}
              disabled={isSubmitting}
              className="w-full py-3.5 border-2 border-gray-100 dark:border-zinc-700 rounded-full flex items-center justify-center gap-2 font-bold text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
            >
              <GoogleLogo /> <span>{t.googleSignIn || "Continue with Google"}</span>
            </button>

            <button 
              onClick={() => handleSocialLogin('apple')} 
              disabled={isSubmitting}
              className="w-full py-3.5 bg-black dark:bg-[#2a2a2a] border-2 border-black dark:border-zinc-700 rounded-full flex items-center justify-center gap-2 font-bold text-sm text-white hover:opacity-90 transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
            >
              <AppleLogo /> <span>{t.appleSignIn || "Continue with Apple"}</span>
            </button>
          </div>

          <div className="text-center px-4 pt-2">
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium leading-relaxed">
              {t.agreementPrefix}
              <button 
                onClick={() => openExternalLink('https://www.shoflakklba.app/terms')}
                className="text-[#e2a05e] hover:opacity-80 font-bold underline underline-offset-2"
              >
                {t.termsAndConditions}
              </button>
              {t.agreementAnd}
              <button 
                onClick={() => openExternalLink('https://www.shoflakklba.app/privacy')}
                className="text-[#e2a05e] hover:opacity-80 font-bold underline underline-offset-2"
              >
                {t.privacyPolicy}
              </button>
              .
            </p>
          </div>

          {loginError && (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 rounded-2xl flex flex-col items-center gap-2 animate-in shake">
              <p className="text-orange-600 dark:text-orange-400 text-xs font-bold text-center">{loginError}</p>
            </div>
          )}
          
          {isSubmitting && (
            <div className="flex items-center justify-center gap-3 text-[#e2a05e] font-bold py-2">
              <Loader2 className="animate-spin" size={20} />
              <span>Connecting...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
