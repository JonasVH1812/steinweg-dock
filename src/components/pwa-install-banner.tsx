'use client';

import { useState } from 'react';
import { Download, X, Share } from 'lucide-react';

interface PWAState {
  isIOS: boolean;
  isStandalone: boolean;
  showIOSGuide: boolean;
}

function getInitialState(): PWAState {
  if (typeof window === 'undefined') {
    return { isIOS: false, isStandalone: false, showIOSGuide: false };
  }
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream: boolean }).MSStream;
  const standalone = (window.navigator as unknown as { standalone: boolean }).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  if (standalone) return { isIOS: iOS, isStandalone: standalone, showIOSGuide: false };
  const dismissed = localStorage.getItem('pwa-banner-dismissed');
  if (dismissed && Date.now() - parseInt(dismissed) < 3 * 24 * 60 * 60 * 1000) {
    return { isIOS: iOS, isStandalone: standalone, showIOSGuide: false };
  }
  return { isIOS: iOS, isStandalone: standalone, showIOSGuide: iOS };
}

export function PWAInstallBanner() {
  const [state, setState] = useState<PWAState>(getInitialState);

  if (state.isStandalone || !state.showIOSGuide) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-slate-900 via-slate-800 to-slate-800/95 border-t border-amber-500/30 shadow-2xl">
      <div className="max-w-lg mx-auto">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shrink-0">
            <Download className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-base">Install Steinweg Dock App</p>
            <p className="text-slate-400 text-sm mt-1">Get quick access from your home screen — works like a native app!</p>

            <div className="mt-3 bg-slate-700/50 rounded-lg p-3">
              <p className="text-amber-400 font-semibold text-sm mb-2">How to install on iPhone:</p>
              <ol className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Tap the <Share className="h-4 w-4 inline text-amber-400" /> <strong>Share button</strong> at the bottom of Safari</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Scroll down and tap <strong className="text-amber-400">&quot;Add to Home Screen&quot;</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Tap <strong>&quot;Add&quot;</strong> — the ⚓ icon appears on your home screen</span>
                </li>
              </ol>
            </div>
          </div>
          <button
            onClick={() => {
              setState(prev => ({ ...prev, showIOSGuide: false }));
              localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
            }}
            className="p-1 hover:bg-slate-700 rounded shrink-0"
            aria-label="Dismiss install banner"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
