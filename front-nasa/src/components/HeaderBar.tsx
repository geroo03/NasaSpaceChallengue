import { HelpCircle, UserRound } from 'lucide-react';
import { useGuide } from './guide/GuideContext';
import { useLang, type Lang } from '../i18n/LangContext';
import { useProfile } from '../profile/ProfileContext';

export type Screen = 'explore' | 'method';

export function HeaderBar({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void }) {
  const { t, lang, setLang } = useLang();
  const { profile, setEditing } = useProfile();
  const guide = useGuide();
  const items: Screen[] = ['explore', 'method'];
  return (
    <header className="print:hidden sm:sticky sm:top-0 z-[1100] bg-[#283618] text-[#FEFAE0] border-b border-[#1d2711] shadow-sm">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 min-h-16 py-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <button
          type="button"
          onClick={() => onNavigate('explore')}
          className="shrink-0 text-left text-[#FEFAE0] rounded focus-visible:outline-2 focus-visible:outline-[#DDA15E]"
        >
          <img src="/brand/agrofield-logo-negativo-animado.svg" alt="AgroField" width={567} height={240} className="block h-12 sm:h-14 w-auto -my-1" />
          <span className="sr-only">{t('brand.tagline')}</span>
        </button>

        <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-2 sm:gap-x-6">
          <nav aria-label={t('nav.main')} className="flex items-center gap-4 sm:gap-6">
            {items.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                aria-current={screen === id ? 'page' : undefined}
                className={`text-sm font-bold py-1 border-b-2 rounded-sm focus-visible:outline-2 focus-visible:outline-[#DDA15E] ${
                  screen === id ? 'text-[#FEFAE0] border-[#DDA15E]' : 'text-[#FEFAE0]/75 border-transparent hover:text-[#FEFAE0]'
                }`}
              >
                {t(`nav.${id}`)}
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => {
              guide.reset();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-label={t('guide.show')}
            title={t('guide.show')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#FEFAE0]/30 px-2.5 py-1 text-xs font-bold text-[#FEFAE0] hover:bg-[#FEFAE0]/10 focus-visible:outline-2 focus-visible:outline-[#DDA15E]"
          >
            <HelpCircle aria-hidden className="h-4 w-4" />
            <span>{t('guide.button')}</span>
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex max-w-[11rem] items-center gap-1.5 rounded-lg border border-[#FEFAE0]/30 px-2.5 py-1 text-xs font-bold text-[#FEFAE0] hover:bg-[#FEFAE0]/10 focus-visible:outline-2 focus-visible:outline-[#DDA15E]"
          >
            <UserRound aria-hidden className="h-4 w-4 shrink-0" />
            <span className="truncate">{profile ? profile.name : t('login.enter')}</span>
          </button>
          <div role="group" aria-label={t('lang.label')} className="flex rounded-lg border border-[#FEFAE0]/30 bg-[#FEFAE0]/10 p-0.5">
            {(['es', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={lang === l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 text-xs font-bold rounded-md min-w-9 focus-visible:outline-2 focus-visible:outline-[#DDA15E] ${
                  lang === l ? 'bg-[#FEFAE0] text-[#283618]' : 'text-[#FEFAE0]/85 hover:text-[#FEFAE0]'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
