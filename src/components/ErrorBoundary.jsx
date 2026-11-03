import { Component } from "react";

// Si un método falla mientras se muestra, solo ese panel muestra el error
// y el resto de la página (introducción y otras pestañas) sigue funcionando.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(`Error en el método «${this.props.name}»:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="placeholder">
          Ocurrió un error en «{this.props.name}». Puedes usar las otras
          pestañas mientras tanto.
        </div>
      );
    }
    return this.props.children;
  }
}