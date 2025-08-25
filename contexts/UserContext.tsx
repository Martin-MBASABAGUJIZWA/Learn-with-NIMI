"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { syncGuestProgressToSupabase } from "@/lib/guestProgress";

interface UserType {
  id: string;
  email?: string;
  [key: string]: any;
}

interface ProfileType {
  full_name?: string;
  language?: string;
  points?: number;
  isAdmin?: boolean;
  [key: string]: any;
}

interface UserContextType {
  user: UserType | null;
  profile: ProfileType | null;
  loading: boolean;
  updateUser: (user: UserType | null) => void;
  updateProfile: (profile: ProfileType | null) => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      try {
        // Fetch profile from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Failed to fetch profile:", profileError.message);
          setProfile(null);
          return;
        }

        // Fetch admin record if exists
        const { data: adminData, error: adminError } = await supabase
          .from("admins")
          .select("*")
          .eq("id", userId)
          .single();

        if (adminError && adminError.code !== "PGRST116") {
          console.error("Failed to fetch admin record:", adminError.message);
        }

        // Merge data
        setProfile({
          ...profileData,
          isAdmin: !!adminData, // true if found in admins
          ...(adminData || {}),
        });
      } catch (err) {
        console.error("Unexpected error fetching profile:", err);
        setProfile(null);
      }
    };

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id);
          if (event === "SIGNED_IN") {
            await syncGuestProgressToSupabase(currentUser.id);
          }
        } else {
          setProfile(null);
        }

        if (event === "SIGNED_OUT") {
          router.push("/login");
        }

        setLoading(false);
      }
    );

    // Initial fetch
    const getSessionAndProfile = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    };

    getSessionAndProfile();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const updateUser = (newUser: UserType | null) => {
    setUser(newUser);
  };

  const updateProfile = (newProfile: ProfileType | null) => {
    setProfile(newProfile);
  };

  return (
    <UserContext.Provider value={{ user, profile, loading, updateUser, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
