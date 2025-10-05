// src/App.tsx
import { useState, useEffect } from "react";
import { ToastProvider } from "./components/Toast";
import { useGlobalSessionManager } from "./hooks/useGlobalSessionManager";
import { useAuthStore } from "./stores";
import { AuthScreen } from "./screens/AuthScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { BoxScreen } from "./screens/BoxScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { LogsScreen, SplashScreen } from "./screens";
import './App.css';

type Screen = "splash" | "auth" | "home" | "box" | "settings" | "logs"; // Add "splash"

function App() {
  // Start with splash screen instead of auth
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash");
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);

  const isUnlocked = useAuthStore(state => state.isUnlocked);
  const lock = useAuthStore(state => state.lock);

  // Handle session expiration - works from any screen
  const handleSessionExpired = async () => {
    console.log("🔒 Auto-locking due to session expiration");
    try {
      await lock();
      setCurrentScreen("auth");
      setSelectedBoxId(null);
    } catch (error) {
      console.error("Failed to lock on session expiry:", error);
      // Force logout anyway
      setCurrentScreen("auth");
      setSelectedBoxId(null);
    }
  };

  // Global session manager - runs regardless of current screen
  useGlobalSessionManager({ onSessionExpired: handleSessionExpired });

  // Auto-redirect to auth if not unlocked (but not from splash)
  useEffect(() => {
    if (!isUnlocked && currentScreen !== "auth" && currentScreen !== "splash") {
      setCurrentScreen("auth");
      setSelectedBoxId(null);
    }
  }, [isUnlocked, currentScreen]);

  // Handle splash screen completion
  const handleSplashComplete = () => {
    setCurrentScreen("auth");
  };

  const handleAuthSuccess = (destination: "home" | "dev" = "home") => {
    if (destination === "dev") {
      // TODO: Navigate to dev screen when implemented
      setCurrentScreen("home");
    } else {
      setCurrentScreen("home");
    }
    setSelectedBoxId(null);
  };

  const handleNavigateToBox = (boxId: string) => {
    setSelectedBoxId(boxId);
    setCurrentScreen("box");
  };

  const handleNavigateToHome = () => {
    setCurrentScreen("home");
    setSelectedBoxId(null);
  };

  const handleNavigateToSettings = () => {
    setCurrentScreen("settings");
  };

  const handleNavigateToLogs = () => {
    setCurrentScreen("logs");
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case "splash":
        return (
          <SplashScreen
            onComplete={handleSplashComplete}
            duration={2500} // 2.5 seconds - adjust as needed
          />
        );

      case "auth":
        return (
          <AuthScreen
            onSuccess={handleAuthSuccess}
            isSessionExpired={false}
          />
        );

      case "home":
        return (
          <HomeScreen
            onOpenSettings={handleNavigateToSettings}
            onNavigateToBox={handleNavigateToBox}
            onOpenLogs={handleNavigateToLogs}
          />
        );

      case "box":
        return selectedBoxId ? (
          <BoxScreen
            boxId={selectedBoxId}
            onNavigateBack={handleNavigateToHome}
          />
        ) : (
          <HomeScreen
            onOpenSettings={handleNavigateToSettings}
            onNavigateToBox={handleNavigateToBox}
            onOpenLogs={handleNavigateToLogs}
          />
        );

      case "settings":
        return (
          <SettingsScreen onBack={handleNavigateToHome} />
        );

      case "logs":
        return (
          <LogsScreen onBack={handleNavigateToHome} />
        );

      default:
        return (
          <AuthScreen
            onSuccess={handleAuthSuccess}
            isSessionExpired={false}
          />
        );
    }
  };

  return (
    <ToastProvider>
      {renderCurrentScreen()}
    </ToastProvider>
  );
}

export default App;