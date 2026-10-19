"use client";

import { useEffect, useRef, useState } from "react";

// Animates a number from its previous value to `target` with an exponential
// ease-out, so the build total visibly rolls up as each price lands. Jumps
// straight to the target when the user prefers reduced motion
export function useCountUp(target, durationMs = 700) {
    const [shown, setShown] = useState(target);
    const shownRef = useRef(target);

    useEffect(() => {
        const from = shownRef.current;
        if (from === target) return;

        const set = (value) => {
            shownRef.current = value;
            setShown(value);
        };

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            set(target);
            return;
        }

        const start = performance.now();
        let frame;
        const step = (now) => {
            const t = Math.min((now - start) / durationMs, 1);
            const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            set(from + (target - from) * eased);
            if (t < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
    }, [target, durationMs]);

    return shown;
}
