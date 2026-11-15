import { useEffect, useState } from 'react';
import { CloudRain, Loader2, Snowflake, Thermometer, Wind } from 'lucide-react';
import { useLang } from '../../i18n/LangContext';
import { dayAlerts, fetchForecast, LIMITS, weekSummary, type AlertKind, type Forecast } from '../../case/forecast';
import { Card, Notice, SectionTitle } from '../ui';

const ICON: Record<AlertKind, typeof CloudRain> = { rain: CloudRain, heat: Thermometer, frost: Snowflake, wind: Wind };
const TONE: Record<AlertKind, string> = {
  rain: 'bg-[#E3EEF4] text-[#1F4E6B] border-[#9CC0D4]',
  heat: 'bg-[#FBE7D6] text-[#7A3A0E] border-[#E0A774]',
  frost: 'bg-[#E8ECF6] text-[#2D3C6B] border-[#A9B6DA]',
  wind: 'bg-[#EFEBE0] text-[#4A3F27] border-[#C9BC97]',
};

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: Forecast };

/** Next 7 days at the lot: what to postpone (irrigation, spraying) and what to watch (heat, frost). */
export function ForecastPanel({ lat, lon }: { lat: number; lon: number }) {
  const { t, num, lang } = useLang();
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    const ctl = new AbortController();
    setState({ status: 'loading' });
    let live = true;
    const timer = window.setTimeout(() => ctl.abort(), 12_000);
    fetchForecast(lat, lon, ctl.signal)
      .then((data) => live && setState({ status: 'ready', data }))
      .catch(() => live && setState({ status: 'error' }))
      .finally(() => window.clearTimeout(timer));
    return () => {
      live = false;
      ctl.abort();
    };
  }, [lat, lon]);

  const locale = lang === 'es' ? 'es-AR' : 'en-US';
  const dayName = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric' });

  return (
    <Card className="min-w-0" as="section">
      <SectionTitle sub={t('fc.help')}>{t('fc.title')}</SectionTitle>
      {state.status === 'loading' && (
        <p className="flex items-center gap-2 text-sm text-[#3B2F20]">
          <Loader2 className="size-4 animate-spin" aria-hidden /> {t('fc.loading')}
        </p>
      )}
      {state.status === 'error' && <Notice tone="warn">{t('fc.error')}</Notice>}
      {state.status === 'ready' && <Ready data={state.data} dayName={dayName} />}
    </Card>
  );

  function Ready({ data, dayName }: { data: Forecast; dayName: (iso: string) => string }) {
    const s = weekSummary(data.days);
    const advice: string[] = [];
    if (s.rainMm >= LIMITS.rainMm) advice.push(t('fc.adv.rain', { mm: num(s.rainMm) }));
    else advice.push(t('fc.adv.dry', { mm: num(-s.balanceMm) }));
    if (s.hotDays) advice.push(t('fc.adv.heat', { n: String(s.hotDays), c: String(LIMITS.heatC) }));
    advice.push(s.sprayDays.length ? t('fc.adv.spray', { days: s.sprayDays.map(dayName).join(', ') }) : t('fc.adv.noSpray', { kmh: String(LIMITS.windKmh) }));
    return (
      <div className="space-y-4">
        {data.cachedOn && <Notice tone="info">{t('fc.cached', { date: new Date(data.cachedOn).toLocaleString() })}</Notice>}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
          <Stat label={t('fc.rain')} value={`${num(s.rainMm)} mm`} />
          <Stat label={t('fc.et0')} value={`${num(s.et0Mm)} mm`} />
          <Stat label={t('fc.balance')} value={`${s.balanceMm >= 0 ? '+' : '−'}${num(Math.abs(s.balanceMm))} mm`} strong={s.balanceMm < 0} />
        </div>
        <ul className="space-y-1.5 text-sm text-[#283618]">
          {advice.map((a) => (
            <li key={a} className="flex gap-2"><span aria-hidden>•</span><span>{a}</span></li>
          ))}
        </ul>
        <div className="-mx-1 overflow-x-auto pb-1">
          <ol className="fs-stagger flex gap-2 px-1 min-w-max">
            {data.days.map((d) => {
              const alerts = dayAlerts(d);
              return (
                <li key={d.date} className="w-[104px] shrink-0 rounded-xl border border-[#DECFA7] bg-white p-2.5 text-center">
                  <p className="text-xs font-bold capitalize text-[#283618]">{dayName(d.date)}</p>
                  <p className="mt-1 text-sm tabular-nums">
                    <span className="font-bold text-[#7A3A0E]">{num(d.tmax)}°</span> <span className="text-[#3B2F20]/70">{num(d.tmin)}°</span>
                  </p>
                  <p className="text-xs tabular-nums text-[#1F4E6B]">
                    {num(d.rainMm, d.rainMm > 0 && d.rainMm < 10 ? 1 : 0)} mm{d.rainProb !== null ? ` · ${num(d.rainProb)}%` : ''}
                  </p>
                  <p className="text-xs tabular-nums text-[#3B2F20]/80">{num(d.windKmh)} km/h</p>
                  {alerts.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap justify-center gap-1">
                      {alerts.map((a) => {
                        const Icon = ICON[a];
                        return (
                          <span key={a} title={t(`fc.al.${a}`)} className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${TONE[a]}`}>
                            <Icon className="size-3" aria-hidden /> {t(`fc.al.${a}`)}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
        <p className="text-xs text-[#3B2F20]/85">{t('fc.note')}</p>
      </div>
    );
  }
}

function Stat({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#DECFA7] bg-white px-2 py-2">
      <p className="text-[11px] text-[#3B2F20]/80">{label}</p>
      <p className={`text-base sm:text-lg font-bold tabular-nums ${strong ? 'text-[#7A3A0E]' : 'text-[#283618]'}`}>{value}</p>
    </div>
  );
}
