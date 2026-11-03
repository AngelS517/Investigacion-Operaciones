import { useEffect, useState } from "react";
import { METHODS } from "./methods";
import Intro from "./components/Intro";
import Tabs from "./components/Tabs";
import MethodPanel from "./components/MethodPanel";
import "./App.css";

// Si la URL trae #simplex, #noroeste o #minimos se salta la introducción.
function methodFromHash() {
  const id = window.location.hash.replace("#", "");
  return METHODS.some((m) => m.id === id) ? id : null;
}

export default function App() {
  const [active, setActive] = useState(methodFromHash); // null = introducción

  useEffect(() => {
    const url = active ? `#${active}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [active]);

  const current = METHODS.find((m) => m.id === active);

  return (
    <>
      <div className="stars" aria-hidden="true" />

      <header className="topbar">
        <a
          href="/"
          className="logo"
          aria-label="Volver al inicio"
          onClick={(e) => {
            e.preventDefault();
            setActive(null);
          }}
        >
          ORION
        </a>
      </header>

      <main className="screen">
        {current ? (
          <>
            <Tabs active={active} onChange={setActive} />
            <MethodPanel method={current} />
          </>
        ) : (
          <Intro onContinue={() => setActive("simplex")} />
        )}
      </main>
    </>
  );
}