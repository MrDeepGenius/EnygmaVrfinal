import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ProfileId = "senor" | "senora" | "kids";

interface ProfileContextType {
  profile: ProfileId | null;
  setProfile: (profile: ProfileId | null) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<ProfileId | null>(() => {
    const saved = localStorage.getItem("enygma-profile");
    return (saved as ProfileId) || null;
  });

  const setProfile = (newProfile: ProfileId | null) => {
    setProfileState(newProfile);
    if (newProfile) {
      localStorage.setItem("enygma-profile", newProfile);
    } else {
      localStorage.removeItem("enygma-profile");
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
