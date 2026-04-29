'use client';

import Link from 'next/link';
import GarminConnectForm from './GarminConnectForm';

interface Props {
  userId: string;
  userName: string;
  userEmail: string;
  hasStrava: boolean;
}

export default function SettingsPage({ userName, userEmail, hasStrava }: Props) {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-24 sm:px-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>

      {/* Mi cuenta */}
      <section className="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Mi cuenta</h2>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Nombre</p>
            <p className="text-sm font-medium text-gray-900">{userName || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Email</p>
            <p className="text-sm font-medium text-gray-900">{userEmail || '—'}</p>
          </div>
        </div>
      </section>

      {/* Integraciones */}
      <section className="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Integraciones</h2>

        {/* Strava */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏃</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Strava</p>
              <p className="text-xs text-gray-400">Sincroniza actividades automáticamente</p>
            </div>
          </div>
          {hasStrava ? (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">
              Conectado
            </span>
          ) : (
            <a
              href="/api/strava/login-url"
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-orange-500 text-white"
            >
              Conectar
            </a>
          )}
        </div>

        <div className="border-t border-gray-100" />

        {/* Garmin */}
        <GarminConnectForm />
      </section>

      {/* Accesos rápidos */}
      <section className="rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
        <Link href="/checkin" className="flex items-center justify-between px-5 py-4 text-sm text-gray-700 hover:bg-gray-50 rounded-t-2xl">
          <span>Check-in diario</span>
          <span className="text-gray-400">→</span>
        </Link>
        <Link href="/dashboard" className="flex items-center justify-between px-5 py-4 text-sm text-gray-700 hover:bg-gray-50 rounded-b-2xl">
          <span>Ir al inicio</span>
          <span className="text-gray-400">→</span>
        </Link>
      </section>
    </div>
  );
}
