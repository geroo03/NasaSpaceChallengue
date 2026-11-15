import { useLang, type Lang } from '../i18n/LangContext';

export type Screen = 'explore' | 'method';

export function HeaderBar({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void }) {
  const { t, lang, setLang } = useLang();
  const items: Screen[] = ['explore', 'method'];
  return (
    <header className="print:hidden sticky top-0 z-[1100] bg-[#283618] text-[#FEFAE0] border-b border-[#1d2711] shadow-sm">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 min-h-16 py-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <button
          type="button"
          onClick={() => onNavigate('explore')}
          className="text-left text-[#FEFAE0] rounded focus-visible:outline-2 focus-visible:outline-[#DDA15E]"
        >
          <span className="block text-xl tracking-[0.06em] leading-none">
            <span className="font-extralight uppercase">FIELD</span>
            <span className="font-bold uppercase">SHIFT</span>
            <span className="ml-1.5 text-sm font-bold text-[#DDA15E] align-top">{t('brand.lab')}</span>
          </span>
          <span className="hidden sm:block text-xs text-[#FEFAE0]/75 mt-1">{t('brand.tagline')}</span>
        </button>

        <div className="flex items-center gap-4 sm:gap-7">
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
