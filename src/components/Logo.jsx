import { useState } from "react";

// Logo de ORION.
// - Si existe el archivo public/logo.png se muestra esa imagen.
// - Si no existe, se muestra un símbolo de constelación dibujado aquí mismo.
export default function Logo() {
  const [logoOk, setLogoOk] = useState(false);

  return (
    <>
      <img
        className="logo__img"
        src="/logo.png"
        alt=""
        style={{ display: logoOk ? undefined : "none" }}
        onLoad={() => setLogoOk(true)}
        onError={() => setLogoOk(false)}
      />

      {!logoOk && (
        <svg className="logo__mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <g stroke="currentColor" strokeWidth="1" strokeOpacity="0.55" strokeLinecap="round">
            <path d="M9 5 L12 15 L9 27" />
            <path d="M23 6 L20 17 L24 26" />
            <path d="M12 15 L20 17" />
          </g>
          <g fill="currentColor">
            <circle cx="9" cy="5" r="1.8" />
            <circle cx="23" cy="6" r="1.8" />
            <circle cx="12" cy="15" r="1.5" />
            <circle cx="16" cy="16" r="1.5" />
            <circle cx="20" cy="17" r="1.5" />
            <circle cx="9" cy="27" r="1.8" />
            <circle cx="24" cy="26" r="2.2" />
          </g>
        </svg>
      )}

      <span className="logo__text">ORION</span>
    </>
  );
}