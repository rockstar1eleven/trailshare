import React from 'react';
import { supabase } from '../../lib/supabase';

export function useSession() {
  const [session, setSession] = React.useState<any>(null);
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => { sub.subscription.unsubscribe(); };
  }, []);
  return session;
}

export function SignInPanel() {
  async function signIn(provider: 'google' | 'apple') {
    const redirectTo = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) alert('Auth error: ' + error.message);
  }
  return (
    <div className="rounded-xl border p-4 space-y-2">
      <div className="font-semibold">Sign in</div>
      <button onClick={() => signIn('google')} className="rounded-lg border px-3 py-2 w-full">Continue with Google</button>
      <button onClick={() => signIn('apple')} className="rounded-lg border px-3 py-2 w-full">Continue with Apple</button>
    </div>
  );
}

export function SignOutButton() {
  return <button onClick={() => supabase.auth.signOut()} className="rounded-lg border px-3 py-2">Sign out</button>;
}
