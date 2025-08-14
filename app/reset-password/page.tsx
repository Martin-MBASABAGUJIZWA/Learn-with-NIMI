'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ResetPassword() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Grab the access token from URL hash (#access_token=...)
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    setToken(accessToken);
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMessage('⚠️ Missing or invalid reset token.');
      return;
    }

    setLoading(true);
    setMessage('••••••••••\nUpdating... 🌀');

    const { error } = await supabase.auth.updateUser(
      { password },
      { access_token: token }
    );

    setLoading(false);

    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      setMessage('✅ Password updated successfully! 🥳');
      setTimeout(() => router.push('/loginpage'), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6 transform hover:scale-[1.02] transition-transform duration-300">
        <h2 className="text-3xl font-bold text-center text-purple-700 animate-pulse">
          Reset Password 🔑
        </h2>

        {message && (
          <pre className="text-center text-purple-600 bg-purple-100 p-3 rounded whitespace-pre-wrap">
            {message}
          </pre>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-400"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating... 🌀' : 'Update Password 🔑'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Remembered your password?{' '}
          <a href="/loginpage" className="text-purple-600 hover:underline">
            Log in 👀
          </a>
        </p>
      </div>
    </div>
  );
}
