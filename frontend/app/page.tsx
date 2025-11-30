"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, fetchUser, user } = useAuthStore();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        await fetchUser();
        
        if (mounted) {
          setHasChecked(true);
          // Get fresh state after fetchUser
          const state = useAuthStore.getState();
          if (state.isAuthenticated && state.user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        if (mounted) {
          setHasChecked(true);
          router.push("/login");
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [router, fetchUser]);

  // Watch for auth state changes after initial check
  useEffect(() => {
    if (hasChecked) {
      if (isAuthenticated && user) {
        router.push("/dashboard");
      } else if (!isAuthenticated) {
        router.push("/login");
      }
    }
  }, [hasChecked, isAuthenticated, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse">Loading...</div>
    </div>
  );
}
