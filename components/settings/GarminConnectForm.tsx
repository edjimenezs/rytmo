'use client';

import { useEffect, useState } from 'react';

type Status = 'loading' | 'connected' | 'disconnected';

export default function GarminConnectForm() {
  const [status, setStatus] = useState<Status>('loading');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/garmin/connect')
      .then(r => r.json())
      .then((d: { connected: boolean; displayName?: string }) => {
        if (d.connected) {
          setDisplayName(d.displayName ?? '');
          setStatus('connected');
        } else {
          setStatus('disconnected');
        }
      })
      .catch(() => setStatus('disconnected'));
  }, []);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setWorking(true);
    try {
      const res = await fetch('/api/garmin/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { ok?: boolean; displayName?: string; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Error al conectar');
      } else {
        setDisplayName(data.displayName ?? email);
        setStatus('connected');
        setPassword('');
      }
    } catch {
      setError('Error de red');
    } finally {
      setWorking(false);
    }
  }

  async function handleDisconnect() {
    setWorking(true);
    try {
      await fetch('/api/garmin/connect', { method: 'DELETE' });
      setStatus('disconnected');
      setDisplayName('');
    } catch {
      setError('Error al desconectar');
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="py-2">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">⌚</span>
        <div>
          <p className="text-sm font-medium text-gray-900">Garmin Connect</p>
          <p className="text-xs text-gray-400">Sueño, body battery y salud diaria</p>
        </div>
      </div>

      {status === 'loading' && (
        <div className="h-8 w-32 rounded-lg bg-gray-100 animate-pulse" />
      )}

      {status === 'connected' && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-teal-100 text-teal-700">
            ✓ {displayName || 'Conectado'}
          </span>
          <button
            onClick={handleDisconnect}
            disabled={working}
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            {working ? 'Desconectando…' : 'Desconectar'}
          </button>
        </div>
      )}

      {status === 'disconnected' && (
        <form onSubmit={handleConnect} className="space-y-3">
          <input
            type="email"
            placeholder="Email de Garmin Connect"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={working}
            className="w-full rounded-xl bg-teal-500 text-white text-sm font-medium py-2.5 hover:bg-teal-600 disabled:opacity-50"
          >
            {working ? 'Conectando… (puede tardar ~30s)' : 'Conectar Garmin'}
          </button>
        </form>
      )}
    </div>
  );
}
