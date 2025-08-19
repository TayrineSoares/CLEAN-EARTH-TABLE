// src/pages/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// One source of truth for your API base:
const ROOT = (import.meta.env.VITE_API_BASE || 'http://localhost:8080').replace(/\/+$/, '');
const API_BASE = `${ROOT}/api`;

// Small helper to safely join paths (accepts '/users' or 'users'):
const apiUrl = (p = '') => `${API_BASE}${p.startsWith('/') ? '' : '/'}${p}`;


export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);

      // Case A: hash tokens (#access_token=..., #refresh_token=...)
      const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
      const hashParams = new URLSearchParams(hash);
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
        // clean the URL
        window.history.replaceState({}, '', url.origin + url.pathname);
      }

      // Case B: PKCE code (?code=...)
      const hasCode = url.searchParams.get('code');
      if (!access_token && !refresh_token && hasCode) {
        await supabase.auth.exchangeCodeForSession(url.toString());
      }

      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/login');

      // Tell backend to create the profile after confirmation
      const res = await fetch(apiUrl('/register/confirmation'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) return navigate('/login?confirm=failed');

      navigate('/');
    })();
  }, [navigate]);

  return <p>Signing you in…</p>;
}
