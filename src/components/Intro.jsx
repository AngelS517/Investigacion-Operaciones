import { METHODS } from "../methods";

export default function Intro({ onContinue }) {
  return (
    <section className="hero">
      <p className="eyebrow">Investigación de Operaciones</p>
      <h1>
        Resuelve problemas de optimización <span>paso a paso</span>
      </h1>
      <p className="lead">
        Orion reúne tres métodos clásicos en un solo lugar. Ingresa tu
        problema, obtén la solución óptima y revisa el procedimiento completo.
      </p>

      <div className="cards">
        {METHODS.map((m) => (
          <article className="card" key={m.id}>
            <h2>{m.label}</h2>
            <p>{m.description}</p>
          </article>
        ))}
      </div>

      <button className="btn btn--primary" type="button" onClick={onContinue}>
        Continuar
      </button>
    </section>
  );
}