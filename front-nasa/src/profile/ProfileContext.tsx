import { createContext, useContext, useState, type ReactNode } from 'react';
import { loadProfile, saveProfile, type Profile } from './profile';

interface Ctx {
  profile: Profile | null;
  /** Visitor chose "try without an account" this session. */
  guest: boolean;
  setProfile: (p: Profile | null) => void;
  setGuest: (g: boolean) => void;
  editing: boolean;
  setEditing: (e: boolean) => void;
}

const ProfileCtx = createContext<Ctx | null>(null);
const GUEST_KEY = 'field-shift-lab.guest';

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, set] = useState<Profile | null>(() => loadProfile());
  const [guest, setGuestState] = useState(() => {
    try {
      return window.localStorage.getItem(GUEST_KEY) === '1';
    } catch {
      return false;
    }
  });
  const setGuest = (g: boolean) => {
    try {
      if (g) window.localStorage.setItem(GUEST_KEY, '1');
      else window.localStorage.removeItem(GUEST_KEY);
    } catch {
      // private mode: remembered for this visit only
    }
    setGuestState(g);
  };
  const [editing, setEditing] = useState(false);
  const setProfile = (p: Profile | null) => {
    saveProfile(p);
    set(p);
  };
  return <ProfileCtx.Provider value={{ profile, guest, setProfile, setGuest, editing, setEditing }}>{children}</ProfileCtx.Provider>;
}

export function useProfile(): Ctx {
  const c = useContext(ProfileCtx);
  if (!c) throw new Error('useProfile outside ProfileProvider');
  return c;
}
