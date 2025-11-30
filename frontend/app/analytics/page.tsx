"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useTaskStore } from "@/store/useTaskStore";
import Header from "@/components/Header";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, fetchUser, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      fetchUser();
    }
  }, [isAuthenticated, fetchUser]);

  useEffect(() => {
    if (!isAuthenticated && user === null) {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="neumorphism-card text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="neumorphism-dashboard relative min-h-screen">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <Header />
        <AnalyticsDashboard />
      </div>
    </div>
  );
}

