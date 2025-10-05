// src/components/SplashScreen.tsx
import React, { useEffect, useState } from "react";
import { Shield } from "lucide-react";

interface SplashScreenProps {
    onComplete: () => void;
    duration?: number; // Duration in milliseconds, 0 means externally controlled
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
    onComplete,
    duration = 2500
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [animationPhase, setAnimationPhase] = useState<'enter' | 'loaded' | 'exit'>('enter');

    useEffect(() => {
        // Always start with enter animation
        const timer1 = setTimeout(() => {
            setAnimationPhase('loaded');
        }, 500);

        // If duration is 0, don't auto-complete (externally controlled)
        if (duration === 0) {
            return () => clearTimeout(timer1);
        }

        // Otherwise, use timer-based completion
        const timer2 = setTimeout(() => {
            setAnimationPhase('exit');
        }, duration - 500);

        const timer3 = setTimeout(() => {
            setIsVisible(false);
            onComplete();
        }, duration);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [onComplete, duration]);

    if (!isVisible) return null;

    return (
        <div className={`
            fixed inset-0 bg-black text-white flex items-center justify-center z-50
            transition-opacity duration-500
            ${animationPhase === 'exit' ? 'opacity-0' : 'opacity-100'}
        `}>
            <div className="text-center space-y-6 sm:space-y-8">
                {/* Logo with animation */}
                <div className={`
                    flex justify-center transition-all duration-700 ease-out
                    ${animationPhase === 'enter' ? 'scale-75 opacity-0' : 'scale-100 opacity-100'}
                    ${animationPhase === 'exit' ? 'scale-110 opacity-0' : ''}
                `}>
                    <div className="relative">
                        <img
                            src="/logo.svg"
                            alt="Zap Logo"
                            className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28"
                        />
                        {/* Pulse ring animation */}
                        <div className={`
                            absolute inset-0 rounded-full border-2 border-white/20
                            transition-all duration-1000 ease-out
                            ${animationPhase === 'loaded' ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}
                        `} />
                    </div>
                </div>

                {/* App Title */}
                <div className={`
                    space-y-2 sm:space-y-3 transition-all duration-700 ease-out delay-200
                    ${animationPhase === 'enter' ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}
                    ${animationPhase === 'exit' ? 'translate-y-(-4) opacity-0' : ''}
                `}>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white font-mono tracking-wider">
                        ZAP
                    </h1>
                    <p className="text-gray-400 text-sm sm:text-base lg:text-lg font-mono tracking-wide">
                        Secure Credential Manager
                    </p>
                </div>

                {/* Loading indicator */}
                <div className={`
                    transition-all duration-700 ease-out delay-500
                    ${animationPhase === 'enter' ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}
                    ${animationPhase === 'exit' ? 'translate-y-(-4) opacity-0' : ''}
                `}>
                    <div className="flex items-center justify-center gap-3 sm:gap-4">
                        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" />
                            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 font-mono mt-2 sm:mt-3">
                        Initializing secure environment...
                    </p>
                </div>

                {/* Security badges */}
                <div className={`
                    text-center text-xs text-gray-600 font-mono transition-all duration-700 ease-out delay-700
                    ${animationPhase === 'enter' ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}
                    ${animationPhase === 'exit' ? 'translate-y-(-4) opacity-0' : ''}
                `}>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        <span>AES-256</span>
                        <span>•</span>
                        <span>Zero-Knowledge</span>
                        <span>•</span>
                        <span>Auto-Lock</span>
                    </div>
                </div>
            </div>

            {/* Background pattern (optional subtle effect) */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-10 left-10 w-20 h-20 border border-white/10 rounded-full" />
                <div className="absolute top-20 right-16 w-16 h-16 border border-white/10 rounded-full" />
                <div className="absolute bottom-16 left-20 w-12 h-12 border border-white/10 rounded-full" />
                <div className="absolute bottom-20 right-10 w-24 h-24 border border-white/10 rounded-full" />
            </div>
        </div>
    );
};