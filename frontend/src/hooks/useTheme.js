"use client";

import { useEffect } from "react";

export function useTheme(themePref) {
  useEffect(() => {
    const apply = () => {
      const body = document.body;
      body.classList.remove("theme-amethyst-noir", "theme-white");
      const pref = themePref || "system";
      if (pref === "system") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (!isDark) body.classList.add("theme-white");
      } else if (pref === "white") {
        body.classList.add("theme-white");
      }
    };
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [themePref]);
}
