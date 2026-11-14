import { ArrowDown } from 'lucide-react';
import { useLang } from '../i18n/LangContext';
import { Card, ProvTag } from './ui';

export function MethodScreen() {
  const { t } = useLang();
  const flow = ['method.flow1', 'method.flow2', 'method.flow3', 'method.flow4'];
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="headline-display text-3xl sm:text-4xl text-[#283618]">{t('method.title')}</h1>
        <p className="mt-3 text-[#3B2F20] leading-relaxed">{t('method.lead')}</p>
      </div>

      <Card>
        <h2 className="text-xl font-bold text-[#283618] mb-4">{t('method.flow')}</h2>
        <ol className="space-y-2">
          {flow.map((k, i) => (
            <li key={k}>
              <div className="rounded-xl border border-[#A3B18A] bg-[#E3EBDD] px-4 py-3 font-bold text-[#283618]">
                {i + 1}. {t(k)}
              </div>
              {i < flow.length - 1 && <ArrowDown aria-hidden className="mx-auto my-1 h-4 w-4 text-[#606C38]" />}
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-xl border border-dashed border-[#DECFA7] px-4 py-3 text-sm text-[#3B2F20]">{t('method.flowGibs')}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {(['declared', 'source', 'modeled', 'assumed', 'unknown', 'notUsed'] as const).map((k) => (
            <ProvTag key={k} kind={k} />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-[#283618] mb-3">{t('method.assumptions')}</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
          {['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'].map((k) => (
            <li key={k}>{t(`method.${k}`)}</li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold text-[#283618] mb-3">{t('method.pending')}</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {['p1', 'p2', 'p3', 'p4', 'p5'].map((k) => (
              <li key={k}>{t(`method.${k}`)}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-lg font-bold text-[#283618] mb-3">{t('method.case')}</h2>
          <p className="text-sm leading-relaxed">{t('method.caseText')}</p>
          <h3 className="mt-4 font-bold text-[#283618]">{t('sources.title')}</h3>
          <ul className="mt-1 list-disc pl-5 space-y-1 text-sm">
            <li>
              <a className="underline" href="https://power.larc.nasa.gov/docs/services/api/temporal/daily/" target="_blank" rel="noreferrer">
                NASA POWER Daily API
              </a>
            </li>
            <li>
              <a className="underline" href="https://nasa-gibs.github.io/gibs-api-docs/" target="_blank" rel="noreferrer">
                NASA GIBS
              </a>
            </li>
            <li>
              <a className="underline" href="https://www.fao.org/4/x0490e/x0490e00.htm" target="_blank" rel="noreferrer">
                FAO-56
              </a>
            </li>
            <li>
              <a className="underline" href="https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/" target="_blank" rel="noreferrer">
                NASA Space Apps 2026 · Field Shift
              </a>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
