import { useEffect, useRef, useState } from 'react';
import { Plane, Send, UserRound } from 'lucide-react';
import { useLang } from '../i18n/LangContext';
import { DRONE_PRESETS, type MappingSensor, type OwnDrone, type Profile } from './profile';
import { useProfile } from './ProfileContext';
import { primaryBtn, secondaryBtn } from '../components/ui';

const input = 'mt-1 w-full min-h-[44px] rounded-lg border border-[#DECFA7] bg-white px-3 font-normal text-[#3B2F20]';

function Num({ label, value, onChange, unit }: { label: string; value: number; onChange: (v: number) => void; unit: string }) {
  return (
    <label className="block text-sm font-bold text-[#283618]">
      {label}
      <span className="mt-1 flex items-center gap-2">
        <input type="number" inputMode="decimal" min={0} value={value} onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} className="w-24 min-h-[44px] rounded-lg border border-[#DECFA7] bg-white px-2 tabular-nums font-normal" />
        <span className="font-normal text-[#3B2F20]">{unit}</span>
      </span>
    </label>
  );
}

/** Sign-in (device profile) with the one question that changes the app: do you fly your own drone? */
export function LoginScreen() {
  const { t } = useLang();
  const { profile, setProfile, setGuest, setEditing } = useProfile();
  const [name, setName] = useState(profile?.name ?? '');
  const [farm, setFarm] = useState(profile?.farm ?? '');
  const [hasDrone, setHasDrone] = useState<boolean | null>(profile ? profile.drone !== null : null);
  const [preset, setPreset] = useState(profile?.drone ? (DRONE_PRESETS[profile.drone.model] ? profile.drone.model : 'other') : 'DJI Mavic 3 Multispectral');
  const [drone, setDrone] = useState<OwnDrone>(profile?.drone ?? DRONE_PRESETS['DJI Mavic 3 Multispectral']!);
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => first.current?.focus(), []);

  const pick = (key: string) => {
    setPreset(key);
    setDrone({ ...DRONE_PRESETS[key]! });
  };
  const ok = name.trim().length > 0 && hasDrone !== null && (!hasDrone || (drone.model.trim().length > 0 && (drone.mapping !== 'none' || drone.spray || drone.seed)));
  const submit = () => {
    if (!ok) return;
    const p: Profile = { name: name.trim(), farm: farm.trim(), drone: hasDrone ? { ...drone, model: drone.model.trim() } : null };
    setProfile(p);
    setEditing(false);
  };
  const close = () => (profile ? setEditing(false) : setGuest(true));

  return (
    <div className="fixed inset-0 z-[1500] overflow-y-auto bg-[#283618]/70 backdrop-blur-sm px-4 py-6 sm:py-12" role="dialog" aria-modal="true" aria-labelledby="login-h">
      <form
        className="fs-enter mx-auto max-w-xl rounded-2xl bg-fondo p-5 sm:p-7 shadow-xl space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        onKeyDown={(e) => e.key === 'Escape' && close()}
      >
        <div>
          <img src="/brand/agrofield-logo.svg" alt="AgroField" width={567} height={240} className="h-14 w-auto -ml-2" />
          <h2 id="login-h" className="mt-3 text-2xl font-bold text-[#283618]">{profile ? t('login.editTitle') : t('login.title')}</h2>
          <p className="mt-1 text-sm text-[#3B2F20]">{t('login.help')}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-bold text-[#283618]">
            {t('login.name')}
            <input ref={first} className={input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </label>
          <label className="block text-sm font-bold text-[#283618]">
            {t('login.farm')}
            <input className={input} value={farm} onChange={(e) => setFarm(e.target.value)} autoComplete="organization" />
          </label>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-bold text-[#283618]">{t('login.drone.q')}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type="button"
                aria-pressed={hasDrone === v}
                onClick={() => setHasDrone(v)}
                className={`fs-press flex min-h-[64px] items-start gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm ${hasDrone === v ? 'border-[#283618] bg-[#E3EBDD]' : 'border-[#DECFA7] bg-white'}`}
              >
                {v ? <Plane aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-[#606C38]" /> : <Send aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-[#606C38]" />}
                <span>
                  <strong className="block text-[#283618]">{t(v ? 'login.drone.yes' : 'login.drone.no')}</strong>
                  {t(v ? 'login.drone.yesHelp' : 'login.drone.noHelp')}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        {hasDrone && (
          <div className="fs-enter space-y-4 rounded-xl border border-[#DECFA7] bg-white/70 p-4">
            <label className="block text-sm font-bold text-[#283618]">
              {t('login.drone.model')}
              <select className={input} value={preset} onChange={(e) => pick(e.target.value)}>
                {Object.keys(DRONE_PRESETS).map((k) => (
                  <option key={k} value={k}>{k === 'other' ? t('login.drone.other') : k}</option>
                ))}
              </select>
            </label>
            {preset === 'other' && (
              <label className="block text-sm font-bold text-[#283618]">
                {t('login.drone.modelName')}
                <input className={input} value={drone.model} onChange={(e) => setDrone({ ...drone, model: e.target.value })} />
              </label>
            )}
            <label className="block text-sm font-bold text-[#283618]">
              {t('login.drone.camera')}
              <select className={input} value={drone.mapping} onChange={(e) => setDrone({ ...drone, mapping: e.target.value as MappingSensor, batteryMin: drone.batteryMin || 25 })}>
                {(['none', 'rgb', 'multispectral'] as MappingSensor[]).map((m) => (
                  <option key={m} value={m}>{t(`login.cam.${m}`)}</option>
                ))}
              </select>
            </label>
            {drone.mapping !== 'none' && <Num label={t('login.drone.battery')} value={drone.batteryMin} onChange={(v) => setDrone({ ...drone, batteryMin: v })} unit="min" />}

            <label className="flex items-center gap-2 text-sm font-bold text-[#283618]">
              <input type="checkbox" className="h-5 w-5 accent-[#283618]" checked={drone.spray !== null} onChange={(e) => setDrone({ ...drone, spray: e.target.checked ? { tankL: 20, swathM: 7, speedKmh: 20 } : null })} />
              {t('login.drone.sprays')}
            </label>
            {drone.spray && (
              <div className="flex flex-wrap gap-4 pl-7">
                <Num label={t('login.drone.tank')} value={drone.spray.tankL} onChange={(v) => setDrone({ ...drone, spray: { ...drone.spray!, tankL: v } })} unit="L" />
                <Num label={t('ops.swath')} value={drone.spray.swathM} onChange={(v) => setDrone({ ...drone, spray: { ...drone.spray!, swathM: v } })} unit="m" />
                <Num label={t('ops.speed')} value={drone.spray.speedKmh} onChange={(v) => setDrone({ ...drone, spray: { ...drone.spray!, speedKmh: v } })} unit="km/h" />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm font-bold text-[#283618]">
              <input type="checkbox" className="h-5 w-5 accent-[#283618]" checked={drone.seed !== null} onChange={(e) => setDrone({ ...drone, seed: e.target.checked ? { hopperKg: 25, swathM: 6, speedKmh: 20 } : null })} />
              {t('login.drone.seeds')}
            </label>
            {drone.seed && (
              <div className="flex flex-wrap gap-4 pl-7">
                <Num label={t('login.drone.hopper')} value={drone.seed.hopperKg} onChange={(v) => setDrone({ ...drone, seed: { ...drone.seed!, hopperKg: v } })} unit="kg" />
                <Num label={t('ops.swath')} value={drone.seed.swathM} onChange={(v) => setDrone({ ...drone, seed: { ...drone.seed!, swathM: v } })} unit="m" />
                <Num label={t('ops.speed')} value={drone.seed.speedKmh} onChange={(v) => setDrone({ ...drone, seed: { ...drone.seed!, speedKmh: v } })} unit="km/h" />
              </div>
            )}
            <p className="text-xs text-[#3B2F20]/85">{t('login.drone.note')}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className={primaryBtn} disabled={!ok} aria-disabled={!ok}>
            <UserRound aria-hidden className="h-4 w-4" /> {profile ? t('login.save') : t('login.enter')}
          </button>
          <button type="button" className={secondaryBtn} onClick={close}>
            {profile ? t('login.cancel') : t('login.guest')}
          </button>
          {profile && (
            <button
              type="button"
              className="ml-auto text-sm font-bold text-[#7A3F0C] underline underline-offset-2"
              onClick={() => {
                setProfile(null);
                setEditing(false);
                setGuest(false);
              }}
            >
              {t('login.logout')}
            </button>
          )}
        </div>
        <p className="text-xs text-[#3B2F20]/80">{t('login.privacy')}</p>
      </form>
    </div>
  );
}
