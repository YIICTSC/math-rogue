import { useCallback, useEffect, useState } from 'react';
import { DISTRIBUTION_PLATFORM, OFFLINE_DISTRIBUTABLE } from '../config/runtime';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

const isStandaloneDisplay = (): boolean => {
  if (typeof window === 'undefined') return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches
    || navigatorWithStandalone.standalone === true;
};

/**
 * Exposes the browser's native PWA installation prompt to the title screen.
 * The browser/OS remains responsible for where shortcuts are created.
 */
export const usePwaInstall = () => {
  const pwaEnabled = DISTRIBUTION_PLATFORM === 'web' && !OFFLINE_DISTRIBUTABLE;
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandaloneDisplay());

  useEffect(() => {
    if (!pwaEnabled || typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [pwaEnabled]);

  const install = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === 'accepted') setInstalled(true);
    return choice.outcome === 'accepted';
  }, [installPrompt]);

  return {
    canInstall: pwaEnabled && !installed && installPrompt !== null,
    installed,
    install,
  };
};
