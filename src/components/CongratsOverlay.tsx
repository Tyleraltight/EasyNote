import { useEffect, useState } from 'react';

interface CongratsOverlayProps {
    flagName: string;
    onDone: () => void;
}

/**
 * A subtle, centered congratulations overlay that auto-dismisses.
 * Follows impeccableUI delight principles:
 * - Quick (<1s main animation), auto-dismiss in 2.5s
 * - Non-blocking, click-through pointer-events
 * - Uses transform + opacity only (GPU-accelerated)
 * - Respects prefers-reduced-motion
 */
export default function CongratsOverlay({ flagName, onDone }: CongratsOverlayProps) {
    const [phase, setPhase] = useState<'enter' | 'exit'>('enter');

    useEffect(() => {
        // Start exit fade after 2s
        const exitTimer = setTimeout(() => setPhase('exit'), 2000);
        // Remove from DOM after exit transition completes
        const doneTimer = setTimeout(() => onDone(), 2500);
        return () => {
            clearTimeout(exitTimer);
            clearTimeout(doneTimer);
        };
    }, [onDone]);

    return (
        <div
            className={`congrats-overlay ${phase === 'exit' ? 'congrats-exit' : ''}`}
            aria-live="polite"
            role="status"
        >
            {/* Checkmark circle */}
            <div className="congrats-circle">
                <svg className="congrats-check" viewBox="0 0 52 52" fill="none">
                    <circle
                        className="congrats-check-ring"
                        cx="26" cy="26" r="24"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <path
                        className="congrats-check-path"
                        d="M15 27l7 7 15-15"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            {/* Text */}
            <p className="congrats-title">Goal reached</p>
            <p className="congrats-name">{flagName}</p>
        </div>
    );
}
