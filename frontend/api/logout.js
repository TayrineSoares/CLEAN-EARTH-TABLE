// frontend /api/logout.js
import { supabase } from '../../supabase/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { error } = await supabase.auth.signOut();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err.message);
    return res.status(500).json({ error: 'Server error during logout.' });
  }
}
