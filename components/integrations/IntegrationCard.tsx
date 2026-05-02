'use client';

import { useEffect, useMemo, useState } from 'react';

type IntegrationStatus = {
  connected: boolean;
  externalUserId?: string;
  lastSyncAt?: string | null;
  connectedAt?: string;
};

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  statusEndpoint?: string;
  authEndpoint?: string;
  syncEndpoint?: string;
  disconnectEndpoint?: string;
  helperText?: string;
  ctaHref?: string;
}

export default function IntegrationCard({
  title,
  description,
  icon,
  statusEndpoint,
  authEndpoint,
  syncEndpoint,
  disconnectEndpoint,
  helperText,
  ctaHref,
}: IntegrationCardProps) {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastSyncedLabel = useMemo(() => {
    if (!status?.lastSyncAt) return null;
    try {
      return new Date(status.lastSyncAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return status.lastSyncAt;
    }
  }, [status?.lastSyncAt]);

  useEffect(() => {
    if (!statusEndpoint) return;
    let isActive = true;
    const fetchStatus = async () => {
      setLoadingStatus(true);
      try {
        const res = await fetch(statusEndpoint);
        if (!res.ok) throw new Error('No status');
        const data = (await res.json()) as IntegrationStatus;
        if (isActive) setStatus(data);
      } catch {
        if (isActive) setError('No conectado');
      } finally {
        if (isActive) setLoadingStatus(false);
      }
    };
    void fetchStatus();
    return () => { isActive = false; };
  }, [statusEndpoint]);

  const handleSync = async () => {
    if (!syncEndpoint) return;
    setSyncing(true);
    try {
      const res = await fetch(syncEndpoint, { method: 'POST' });
      if (!res.ok) throw new Error('sync failed');
      const data = await res.json();
      setStatus((prev) => (prev ? { ...prev, lastSyncAt: new Date().toISOString() } : prev));
      setError(null);
      return data;
    } catch {
      setError('No fue posible sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectEndpoint) return;
    setDisconnecting(true);
    try {
      const res = await fetch(disconnectEndpoint, { method: 'POST' });
      if (!res.ok) throw new Error('disconnect failed');
      setStatus({ connected: false });
      setError(null);
    } catch {
      setError('No fue posible desconectar');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[#161b22] border border-white/[0.08] p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-900/30 text-violet-400 text-2xl">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#8b949e]">Integración</p>
          <h3 className="text-xl font-semibold text-[#e6edf3]">{title}</h3>
        </div>
      </div>
      <p className="text-sm text-[#8b949e]">{description}</p>

      {statusEndpoint ? (
        <>
          {loadingStatus ? (
            <p className="text-xs text-[#8b949e]">Cargando estado...</p>
          ) : status?.connected ? (
            <div className="flex flex-col gap-1 text-sm text-[#8b949e]">
              <p className="text-[#e6edf3] text-sm font-semibold">Conectado</p>
              {lastSyncedLabel && <p>Última sincronización: {lastSyncedLabel}</p>}
              {helperText && <p className="text-xs text-[#8b949e]">{helperText}</p>}
            </div>
          ) : (
            <p className="text-sm text-amber-400 font-medium">No conectado</p>
          )}
        </>
      ) : (
        helperText && <p className="text-xs text-[#8b949e]">{helperText}</p>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {status?.connected ? (
          <>
            {syncEndpoint && (
              <button
                type="button"
                disabled={syncing}
                onClick={handleSync}
                className="inline-flex items-center justify-center rounded-full border border-violet-500/30 bg-violet-900/20 px-4 py-2 text-sm font-semibold text-violet-400 hover:bg-violet-900/40 disabled:opacity-50 transition-colors"
              >
                {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
              </button>
            )}
            {disconnectEndpoint && (
              <button
                type="button"
                disabled={disconnecting}
                onClick={handleDisconnect}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#8b949e] hover:bg-white/10 disabled:opacity-50 transition-colors"
              >
                {disconnecting ? 'Desconectando...' : 'Desconectar'}
              </button>
            )}
          </>
        ) : (
          authEndpoint ? (
            <a
              href={authEndpoint}
              className="inline-flex items-center justify-center rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
            >
              Conectar
            </a>
          ) : ctaHref ? (
            <a
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
            >
              Ver detalles
            </a>
          ) : null
        )}
      </div>
    </div>
  );
}
