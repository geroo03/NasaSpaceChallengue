import { useEffect, useState } from 'react';
import { Download, WifiOff } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
}

/** Field conditions: says when there is no signal, and offers to install the app on the phone or tablet. */
export function FieldStatus() {
  const { t } = useLang();
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    const offer = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallPrompt);
    };
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    window.addEventListener('beforeinstallprompt', offer);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      window.removeEventListener('beforeinstallprompt', offer);
    };
  }, []);
  if (online && !install) return null;
  return (
    <div className="print:hidden mb-6 space-y-2">
      {!online && (
        <div role="status" className="fs-enter flex items-start gap-3 rounded-xl border-2 border-[#DDA15E] bg-[#FBE9D0] px-4 py-3 text-sm text-[#5C3209]">
          <WifiOff aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            <strong className="block">{t('field.offline')}</strong>
            {t('field.offlineHelp')}
          </p>
        </div>
      )}
      {install && (
        <div className="fs-enter flex flex-wrap items-center gap-3 rounded-xl border border-[#A3B18A] bg-[#E3EBDD] px-4 py-3 text-sm text-[#283618]">
          <p className="flex-1">{t('field.installHelp')}</p>
          <button
            type="button"
            className="fs-press inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#283618] px-4 font-bold text-[#FEFAE0]"
            onClick={() => {
              void install.prompt().finally(() => setInstall(null));
            }}
          >
            <Download aria-hidden className="h-4 w-4" /> {t('field.install')}
          </button>
        </div>
      )}
    </div>
  );
}
