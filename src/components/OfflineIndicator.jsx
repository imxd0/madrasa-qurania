import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { onSyncStateChange, fullSync } from '../services/syncManager';
import './OfflineIndicator.css';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); setShowBanner(true); setTimeout(() => setShowBanner(false), 3000); };
    const handleOffline = () => { setIsOnline(false); setShowBanner(true); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const unsub = onSyncStateChange(({ isSyncing }) => setSyncing(isSyncing));
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); unsub(); };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    await fullSync();
    setSyncing(false);
  };

  return (
    <>
      <div className={`offline-indicator ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        <span>{isOnline ? 'متصل' : 'غير متصل'}</span>
        {syncing && <RefreshCw className="w-3 h-3 spinning" />}
        {isOnline && !syncing && (
          <button className="sync-btn" onClick={handleSync} title="مزامنة الآن">
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>
      {showBanner && (
        <div className={`sync-banner ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? 'تم الاتصال بالإنترنت — جارٍ المزامنة...' : 'لا يوجد اتصال بالإنترنت — تعمل بدون إنترنت'}
        </div>
      )}
    </>
  );
}
