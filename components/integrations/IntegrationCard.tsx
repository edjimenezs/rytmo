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
        if (!res.ok) {
          throw new Error('No status');
        }
        const data = (await res.json()) as IntegrationStatus;
        if (isActive) {
          setStatus(data);
        }
      } catch {
        if (isActive) {
          setError('No conectado');
        }
      } finally {
        if (isActive) setLoadingStatus(false);
      }
    };
    void fetchStatus();
    return () => {
      isActive = false;
    };
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
    <div className="rounded-2xl bg-white shadow border border-slate-200 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 text-2xl">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">Integración</p>
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
        </div>
      </div>
      <p className="text-sm text-slate-600">{description}</p>

      {statusEndpoint ? (
        <>
          {loadingStatus ? (
            <p className="text-xs text-slate-400">Cargando estado...</p>
          ) : status?.connected ? (
            <div className="flex flex-col gap-1 text-sm text-slate-600">
              <p className="text-slate-900 text-sm font-semibold">Conectado</p>
              {lastSyncedLabel && <p>Última sincronización: {lastSyncedLabel}</p>}
              {helperText && <p className="text-xs text-slate-400">{helperText}</p>}
            </div>
          ) : (
            <p className="text-sm text-amber-600 font-medium">No conectado</p>
          )}
        </>
      ) : (
        helperText && <p className="text-xs text-slate-400">{helperText}</p>
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {status?.connected ? (
          <>
            {syncEndpoint && (
              <button
                type="button"
                disabled={syncing}
                onClick={handleSync}
                className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100 disabled:opacity-50"
              >
                {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
              </button>
            )}
            {disconnectEndpoint && (
              <button
                type="button"
                disabled={disconnecting}
                onClick={handleDisconnect}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                {disconnecting ? 'Desconectando...' : 'Desconectar'}
              </button>
            )}
          </>
        ) : (
          authEndpoint ? (
            <a
              href={authEndpoint}
              className="inline-flex items-center justify-center rounded-full border border-transparent bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Conectar
            </a>
          ) : ctaHref ? (
            <a
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-full border border-transparent bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              Ver detalles
            </a>
          ) : null
        )}
      </div>
    </div>
  );
}
