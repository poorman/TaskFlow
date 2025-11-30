"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";
import MenuButton from "./MenuButton";

export default function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const menuItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Analytics", path: "/analytics" },
    { label: "My Account", path: "/profile" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <header 
      className="neumorphism-header" 
      style={{ padding: '0.5rem 1rem', minHeight: 'auto' }}
      data-dnd-disabled="true"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 
            className="text-lg font-bold cursor-pointer" 
            onClick={() => router.push("/dashboard")}
            style={{ 
              color: '#11A8FD',
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: '1.2'
            }}
          >
            TaskFlow
          </h1>
          <span className="neumorphism-badge" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem' }}>
            SaaS
          </span>
        </div>
        
        {/* Navigation Menu - Button Style */}
        <nav className="flex items-center justify-center gap-2">
          {menuItems.map((item, index) => (
            <div 
              key={item.path}
              style={item.path === "/analytics" || item.path === "/profile" ? { marginTop: '6px' } : {}}
            >
              <MenuButton
                label={item.label}
                isActive={isActive(item.path)}
                onClick={() => router.push(item.path)}
              />
            </div>
          ))}
        </nav>
        
        <div className="flex items-center gap-2">
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs neumorphism-text-secondary" style={{ marginRight: '0.25rem' }}>
              <User className="w-3.5 h-3.5" />
              <span className="font-medium">{user.full_name || user.email}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="neumorphism-button-secondary"
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
