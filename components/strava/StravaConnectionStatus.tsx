'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';

interface StravaStatus {
  connected: boolean;
  stravaUserId?: string;
  lastSyncAt?: string;
  connectedAt?: string;
}

export default function StravaConnectionStatus() {
  const [status, setStatus] = useState<StravaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/strava/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching Strava status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = () => {
    window.location.href = '/api/strava/auth';
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/strava/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ daysBack: 30 }),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Successfully synced ' + data.count + ' activities from Strava!');
        await fetchStatus();
        window.location.reload();
      } else {
        alert('Failed to sync activities');
      }
    } catch (error) {
      console.error('Error syncing activities:', error);
      alert('Failed to sync activities');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Strava? Your synced activities will remain, but you will need to reconnect to sync new activities.')) {
      return;
    }

    setDisconnecting(true);
    try {
      const response = await fetch('/api/strava/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        alert('Strava disconnected successfully');
        await fetchStatus();
      } else {
        alert('Failed to disconnect Strava');
      }
    } catch (error) {
      console.error('Error disconnecting Strava:', error);
      alert('Failed to disconnect Strava');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Strava Integration</h3>
            <p className="mt-1 text-sm text-gray-500">
              Connect your Strava account to automatically sync your activities
            </p>
          </div>
          <button
            onClick={handleConnect}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
            Connect Strava
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-orange-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">Strava Connected</h3>
          </div>
          <div className="mt-2 text-sm text-gray-500 space-y-1">
            <p>Athlete ID: {status.stravaUserId}</p>
            {status.connectedAt && (
              <p>
                Connected {formatDistanceToNow(new Date(status.connectedAt), { addSuffix: true })}
              </p>
            )}
            {status.lastSyncAt && (
              <p>
                Last synced {formatDistanceToNow(new Date(status.lastSyncAt), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        </div>
      </div>
    </div>
  );
}
