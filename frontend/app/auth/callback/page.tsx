"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (token) {
      // Store token
      localStorage.setItem("token", token);
      
      // Fetch user data
      fetchUser().then(() => {
        router.push("/dashboard");
      }).catch(() => {
        router.push("/login");
      });
    } else {
      router.push("/login");
    }
  }, [searchParams, router, fetchUser]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-white">Authenticating...</div>
    </div>
  );
}

