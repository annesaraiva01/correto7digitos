import { continueRender, delayRender } from "remotion";
import { useEffect, useMemo, useState } from "react";

const FONT_LIBRARY = [
  { match: ["montserrat"], google: "Montserrat:wght@400;700;800;900", cssFamily: "Montserrat", fallback: "sans-serif" },
  { match: ["poppins"], google: "Poppins:wght@400;700;800;900", cssFamily: "Poppins", fallback: "sans-serif" },
  { match: ["oswald"], google: "Oswald:wght@400;700", cssFamily: "Oswald", fallback: "sans-serif" },
  { match: ["bebas neue", "bebas+neue"], google: "Bebas+Neue", cssFamily: "Bebas Neue", fallback: "sans-serif" },
  { match: ["raleway"], google: "Raleway:wght@400;700;800", cssFamily: "Raleway", fallback: "sans-serif" },
  { match: ["roboto"], google: "Roboto:wght@400;700;900", cssFamily: "Roboto", fallback: "sans-serif" },
  { match: ["playfair display", "playfair"], google: "Playfair+Display:wght@400;700;800", cssFamily: "Playfair Display", fallback: "serif" },
  { match: ["lato"], google: "Lato:wght@400;700;900", cssFamily: "Lato", fallback: "sans-serif" },
  { match: ["nunito"], google: "Nunito:wght@400;700;800;900", cssFamily: "Nunito", fallback: "sans-serif" },
  { match: ["anton"], google: "Anton", cssFamily: "Anton", fallback: "sans-serif" },
  { match: ["bangers"], google: "Bangers", cssFamily: "Bangers", fallback: "cursive" },
];

const getFontConfig = (captionFont?: string, styleFont?: string) => {
  const raw = `${captionFont || styleFont || ""}`.replace(/["']/g, "").toLowerCase();
  return FONT_LIBRARY.find((font) => font.match.some((m) => raw.includes(m))) || FONT_LIBRARY[0];
};

const ensureGoogleFontStylesheet = (googleFamily: string) => {
  const href = `https://fonts.googleapis.com/css2?family=${googleFamily}&display=swap`;
  const existing = document.querySelector(`link[href="${href}"]`);
  if (existing) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
};

export const useCaptionFont = (captionFont?: string, styleFont?: string) => {
  const config = useMemo(() => getFontConfig(captionFont, styleFont), [captionFont, styleFont]);
  const [fontFamily, setFontFamily] = useState(`'${config.cssFamily}', ${config.fallback}`);
  const [handle] = useState(() => delayRender(`Loading caption font: ${config.cssFamily}`));

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        ensureGoogleFontStylesheet(config.google);
        await Promise.all([
          document.fonts.load(`400 24px ${config.cssFamily}`),
          document.fonts.load(`700 24px ${config.cssFamily}`),
          document.fonts.load(`800 24px ${config.cssFamily}`),
          document.fonts.load(`900 24px ${config.cssFamily}`),
          document.fonts.ready,
        ]);
      } catch (error) {
        console.warn("[remotion-renderer] font preload fallback", error);
      } finally {
        if (active) {
          setFontFamily(`'${config.cssFamily}', ${config.fallback}`);
          continueRender(handle);
        }
      }
    };
    void load();
    return () => { active = false; };
  }, [config, handle]);

  return fontFamily;
};
