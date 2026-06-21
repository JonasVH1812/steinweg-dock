'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function getIsIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function getIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (window.navigator as any).standalone === true;
}

function isDismissedRecently(): boolean {
  if (typeof window === 'undefined') return false;
  const dismissed = localStorage.getItem('pwa-dismissed');
  if (!dismissed) return false;
  return Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000;
}

export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (isDismissedRecently()) return false;
    const isIOS = getIsIOSDevice();
    const standalone = getIsStandalone();
    return isIOS && !standalone;
  });
  const isIOS = getIsIOSDevice();

  useEffect(() => {
    if (isDismissedRecently()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setInstallPrompt(null);
    }
  }, [installPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem('pwa-dismissed', Date.now().toString());
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shrink-0">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Install Steinweg Dock</p>
          {isIOS ? (
            <p className="text-xs text-muted-foreground">
              Tap <Smartphone className="h-3 w-3 inline mx-0.5" /> Share → &quot;Add to Home Screen&quot;
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Quick access from your home screen</p>
          )}
        </div>
        {!isIOS && (
          <Button
            size="sm"
            onClick={handleInstall}
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shrink-0"
          >
            Install
          </Button>
        )}
        <button
          onClick={handleDismiss}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors shrink-0"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
