// src/hooks/useGlobalSessionManager.ts
import { useEffect, useRef } from "react";
import { useAuthStore } from "../stores";

interface UseGlobalSessionManagerOptions {
    onSessionExpired: () => void;
}

export function useGlobalSessionManager({ onSessionExpired }: UseGlobalSessionManagerOptions) {
    const isUnlocked = useAuthStore(state => state.isUnlocked);
    const decrementFrontendTimer = useAuthStore(state => state.decrementFrontendTimer);
    const refreshSessionInfo = useAuthStore(state => state.refreshSessionInfo);
    const frontendTimeLeft = useAuthStore(state => state.frontendTimeLeft);

    // Refs to prevent stale closures
    const onSessionExpiredRef = useRef(onSessionExpired);
    const frontendTimerRef = useRef<NodeJS.Timeout | null>(null);
    const backendSyncRef = useRef<NodeJS.Timeout | null>(null);

    // Update ref when callback changes
    useEffect(() => {
        onSessionExpiredRef.current = onSessionExpired;
    }, [onSessionExpired]);

    // Global frontend timer - runs continuously while unlocked
    useEffect(() => {
        if (!isUnlocked) {
            // Clean up timers when locked
            if (frontendTimerRef.current) {
                clearInterval(frontendTimerRef.current);
                frontendTimerRef.current = null;
            }
            if (backendSyncRef.current) {
                clearInterval(backendSyncRef.current);
                backendSyncRef.current = null;
            }
            return;
        }

        console.log("🕐 Starting global session timers");

        // Frontend 1-second timer for smooth countdown
        frontendTimerRef.current = setInterval(() => {
            decrementFrontendTimer();
        }, 1000);

        // Backend 5-second sync for accuracy
        backendSyncRef.current = setInterval(() => {
            refreshSessionInfo();
        }, 5000);

        return () => {
            if (frontendTimerRef.current) {
                clearInterval(frontendTimerRef.current);
                frontendTimerRef.current = null;
            }
            if (backendSyncRef.current) {
                clearInterval(backendSyncRef.current);
                backendSyncRef.current = null;
            }
            console.log("🛑 Stopped global session timers");
        };
    }, [isUnlocked, decrementFrontendTimer, refreshSessionInfo]);

    // Auto-logout when frontend timer expires
    useEffect(() => {
        if (isUnlocked && frontendTimeLeft <= 0) {
            console.log("⏰ Session expired - triggering logout");
            onSessionExpiredRef.current();
        }
    }, [isUnlocked, frontendTimeLeft]);
}