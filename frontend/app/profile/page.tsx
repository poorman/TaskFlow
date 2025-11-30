"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Header from "@/components/Header";
import { User, Mail, Building, Edit2, Save, X, Lock, Bell, Moon, Sun, Globe } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, fetchUser, user, updateUser, changePassword } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const loadUser = async () => {
      if (!isAuthenticated) {
        await fetchUser();
      }
      setIsLoading(false);
    };
    loadUser();
  }, [isAuthenticated, fetchUser]);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated && user === null && !isLoading) {
      router.push("/login");
    }
  }, [isAuthenticated, user, router, isLoading]);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }
    
    setIsSaving(true);
    setError("");
    setSuccess("");
    
    try {
      await updateUser({
        full_name: fullName.trim(),
        email: email.trim(),
      });
      setSuccess("Profile updated successfully!");
      setIsEditingProfile(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    setIsSaving(true);
    setError("");
    setSuccess("");
    
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to change password");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !user) {
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
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Header />
        <div className="mt-8">
          <h1 className="text-3xl font-bold mb-8 neumorphism-text-primary">My Account & Settings</h1>
          
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Information */}
              <div className="neumorphism-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold neumorphism-text-primary">Profile Information</h2>
                  {!isEditingProfile ? (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="neumorphism-icon-button-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="neumorphism-icon-button-sm"
                        style={{ background: 'var(--neumorphism-primary)', color: 'white' }}
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingProfile(false);
                          setFullName(user.full_name || "");
                          setEmail(user.email || "");
                          setError("");
                        }}
                        className="neumorphism-icon-button-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="neumorphism-logo w-20 h-20 flex-shrink-0">
                      <User className="w-10 h-10 mx-auto text-primary" />
                    </div>
                    <div className="flex-1">
                      {isEditingProfile ? (
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="neumorphism-input text-xl font-bold"
                          placeholder="Full Name"
                        />
                      ) : (
                        <h3 className="text-xl font-bold neumorphism-text-primary">
                          {user.full_name || "User"}
                        </h3>
                      )}
                      {isEditingProfile ? (
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="neumorphism-input mt-2"
                          placeholder="Email"
                        />
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="neumorphism-label flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address
                      </label>
                      {isEditingProfile ? (
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="neumorphism-input"
                          placeholder="your@email.com"
                        />
                      ) : (
                        <p className="mt-2 font-medium">{user.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="neumorphism-label flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Full Name
                      </label>
                      {isEditingProfile ? (
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="neumorphism-input"
                          placeholder="John Doe"
                        />
                      ) : (
                        <p className="mt-2 font-medium">{user.full_name || "Not set"}</p>
                      )}
                    </div>

                    {user.organization_name && (
                      <div>
                        <label className="neumorphism-label flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          Organization
                        </label>
                        <p className="mt-2 font-medium">{user.organization_name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="neumorphism-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold neumorphism-text-primary flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Security
                  </h2>
                  {!isChangingPassword && (
                    <button
                      onClick={() => setIsChangingPassword(true)}
                      className="neumorphism-button-secondary text-sm"
                    >
                      Change Password
                    </button>
                  )}
                </div>

                {isChangingPassword ? (
                  <div className="space-y-4">
                    <div>
                      <label className="neumorphism-label">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="neumorphism-input"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="neumorphism-label">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="neumorphism-input"
                        placeholder="Enter new password (min 8 characters)"
                      />
                    </div>
                    <div>
                      <label className="neumorphism-label">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="neumorphism-input"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleChangePassword}
                        disabled={isSaving}
                        className="neumorphism-button-primary flex-1"
                      >
                        {isSaving ? "Saving..." : "Save Password"}
                      </button>
                      <button
                        onClick={() => {
                          setIsChangingPassword(false);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                          setError("");
                        }}
                        className="neumorphism-button-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    Keep your account secure by regularly updating your password.
                  </p>
                )}
              </div>
            </div>

            {/* Settings Sidebar */}
            <div className="space-y-6">
              {/* Preferences */}
              <div className="neumorphism-card">
                <h2 className="text-xl font-bold neumorphism-text-primary mb-6">Preferences</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Notifications</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Email and push notifications</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifications(!notifications)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notifications ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          notifications ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {darkMode ? (
                        <Moon className="w-5 h-5 text-gray-500" />
                      ) : (
                        <Sun className="w-5 h-5 text-gray-500" />
                      )}
                      <div>
                        <p className="font-medium">Dark Mode</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Toggle dark theme</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        darkMode ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          darkMode ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Globe className="w-5 h-5 text-gray-500" />
                      <label className="font-medium">Language</label>
                    </div>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="neumorphism-input w-full"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="neumorphism-card">
                <h2 className="text-xl font-bold neumorphism-text-primary mb-4">Account Info</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">User ID</p>
                    <p className="font-medium">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Status</p>
                    <p className="font-medium">
                      <span className={`px-2 py-1 rounded ${user.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                  {user.is_admin && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Role</p>
                      <p className="font-medium">
                        <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                          Administrator
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
