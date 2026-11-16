import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadProfile, saveProfile, type Profile } from './profile';
import { cloudEnabled, onSessionChange, signOut } from '../backend/supabase';
import { loadRemoteProfile, saveRemoteProfile } from '../backend/api';
import { clearCloudCaches } from '../backend/cloudLog';

interface Ctx {
  profile: Profile | null;
  /** Visitor chose "try without an account". */
  guest: boolean;
  setProfile: (p: Profile | null) => void;
  setGuest: (g: boolean) => void;
  editing: boolean;
  setEditing: (e: boolean) => void;
  /** Backend configured (Supabase env present). */
  cloud: boolean;
  /** Backend on and nobody signed in: only the example field can be explored. */
  demo: boolean;
  /** Signed-in email, when there is a session. */
  email: string | null;
  /** Remote id of the active drone, for linking requests. */
  droneId: string | null;
  /** Last cloud error, shown softly; local copy keeps working. */
  syncError: boolean;
  logout: () => Promise<void>;
}

const ProfileCtx = createContext<Ctx | null>(null);
const GUEST_KEY = 'field-shift-lab.guest';
const DRONE_KEY = 'field-shift-lab.droneId';

function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeLocal(key: string, v: string | null) {
  try {
    if (v) window.localStorage.setItem(key, v);
    else window.localStorage.removeItem(key);
  } catch {
    // private mode: remembered for this visit only
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, set] = useState<Profile | null>(() => loadProfile());
  const [guest, setGuestState] = useState(() => readLocal(GUEST_KEY) === '1');
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [droneId, setDroneIdState] = useState<string | null>(() => readLocal(DRONE_KEY));
  const [syncError, setSyncError] = useState(false);
  const cloud = cloudEnabled();

  const setDroneId = (id: string | null) => {
    writeLocal(DRONE_KEY, id);
    setDroneIdState(id);
  };
  const setLocal = (p: Profile | null) => {
    saveProfile(p);
    set(p);
  };

  // A session (magic link just opened, or a stored one) brings the profile from the cloud.
  const adopt = useCallback(async (mail: string | null) => {
    setEmail(mail);
    if (!mail) return;
    try {
      const remote = await loadRemoteProfile();
      setSyncError(false);
      if (remote.profile) {
        setLocal(remote.profile);
        setDroneId(remote.droneId);
      } else {
        setEditing(true); // signed in, but no profile yet: ask name and drone
      }
    } catch {
      setSyncError(true);
    }
  }, []);

  useEffect(() => {
    if (!cloud) return;
    return onSessionChange((s) => void adopt(s?.user.email ?? null));
  }, [cloud, adopt]);

  const setGuest = (g: boolean) => {
    writeLocal(GUEST_KEY, g ? '1' : null);
    setGuestState(g);
  };

  const setProfile = (p: Profile | null) => {
    setLocal(p);
    if (!p || !email) return;
    const lang = document.documentElement.lang === 'es' ? 'es' : 'en';
    saveRemoteProfile(p, lang, droneId)
      .then((id) => {
        setDroneId(id);
        setSyncError(false);
      })
      .catch(() => setSyncError(true));
  };

  const logout = async () => {
    await signOut();
    clearCloudCaches();
    setEmail(null);
    setDroneId(null);
    setLocal(null);
    setGuest(false);
  };

  return (
    <ProfileCtx.Provider value={{ profile, guest, setProfile, setGuest, editing, setEditing, cloud, demo: cloud && !email, email, droneId, syncError, logout }}>
      {children}
    </ProfileCtx.Provider>
  );
}

export function useProfile(): Ctx {
  const c = useContext(ProfileCtx);
  if (!c) throw new Error('useProfile outside ProfileProvider');
  return c;
}
