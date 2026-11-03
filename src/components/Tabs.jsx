import { METHODS } from "../methods";

export default function Tabs({ active, onChange }) {
  const handleKeyDown = (e, index) => {
    let next = null;
    if (e.key === "ArrowRight") next = (index + 1) % METHODS.length;
    if (e.key === "ArrowLeft") next = (index - 1 + METHODS.length) % METHODS.length;
    if (next === null) return;

    e.preventDefault();
    onChange(METHODS[next].id);
    document.getElementById(`tab-${METHODS[next].id}`)?.focus();
  };

  return (
    <nav className="tabs panel" role="tablist" aria-label="Métodos">
      {METHODS.map((m, i) => {
        const isActive = m.id === active;
        return (
          <button
            key={m.id}
            id={`tab-${m.id}`}
            type="button"
            role="tab"
            className={`btn tab${isActive ? " is-active" : ""}`}
            aria-selected={isActive}
            aria-controls={`panel-${m.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(m.id)}
            onKeyDown={(e) => handleKeyDown(e, i)}
          >
            {m.label}
          </button>
        );
      })}
    </nav>
  );
}