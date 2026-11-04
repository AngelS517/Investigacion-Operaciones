# ORION · Investigación de Operaciones

Aplicación web para resolver y estudiar problemas clásicos de **Investigación de Operaciones**. Reúne en un solo lugar el método Simplex y dos métodos de solución inicial para problemas de transporte, mostrando el resultado y el procedimiento paso a paso.

## Información académica

| | |
|---|---|
| **Materia** | Investigación de Operaciones |
| **Docente** | David Fernando Santamaría |
| **Institución** | _(completar)_ |
| **Semestre / periodo** | _(completar)_ |
| **Integrantes** | _(nombre 1)_ · _(nombre 2)_ |

## Métodos incluidos

### Método Simplex
Resuelve problemas de programación lineal, ya sea maximizando o minimizando una función objetivo sujeta a restricciones lineales. El usuario ingresa la función objetivo y las restricciones, y la aplicación muestra la solución óptima, la tabla final y el procedimiento.

### Método de la Esquina Noroeste
Obtiene una solución básica inicial factible para problemas de transporte, asignando las cantidades desde la esquina superior izquierda de la tabla de costos.

### Método de Costos Mínimos
También obtiene una solución inicial factible para problemas de transporte, pero priorizando las rutas con el menor costo.

## Estado del proyecto

| Módulo | Estado |
|---|---|
| Portada de introducción y navegación por pestañas | Listo |
| Simplex | En desarrollo |
| Esquina Noroeste | En desarrollo |
| Costos Mínimos | En desarrollo |

## Tecnologías

- [React](https://react.dev/) para la interfaz
- [Vite](https://vite.dev/) como herramienta de desarrollo y empaquetado
- JavaScript (ES Modules)
- ESLint para el análisis de código
- CSS propio, sin librerías de estilos

## Instalación y uso

Requisitos: [Node.js](https://nodejs.org/) instalado.

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd <carpeta-del-proyecto>

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```

Luego abre en el navegador la dirección que aparece en la terminal (normalmente `http://localhost:5173`).

Otros comandos útiles:

```bash
npm run build     # genera la versión de producción
npm run preview   # prueba localmente esa versión
npm run lint      # revisa el código con ESLint
```

## Estructura del proyecto

Cada método vive en su propia carpeta, de modo que se puede trabajar en uno sin afectar a los demás.

```
src/
├── components/            Piezas comunes de la interfaz
│   ├── Intro.jsx          Portada de introducción
│   ├── Tabs.jsx           Barra de pestañas
│   ├── MethodPanel.jsx    Marco común de cada método
│   └── ErrorBoundary.jsx  Aísla errores para que un método no afecte a los otros
├── modules/               Un módulo por método
│   ├── index.js           Registro de módulos
│   ├── simplex/
│   ├── noroeste/
│   └── minimos/
├── methods.js             Lista de métodos (nombre, título y descripción)
├── App.jsx                Componente principal
├── App.css                Estilos generales de la aplicación
├── index.css              Estilos globales y variables de diseño
└── main.jsx               Punto de entrada
```

## Distribución del trabajo

| Integrante | Responsabilidad | Carpeta |
|---|---|---|
| _(nombre 1)_ | Método Simplex | `src/modules/simplex/` |
| _(nombre 2)_ | Esquina Noroeste y Costos Mínimos | `src/modules/noroeste/` y `src/modules/minimos/` |

### Convenciones de trabajo

- Cada integrante modifica solo los archivos de su(s) carpeta(s) para evitar conflictos en Git.
- Los archivos compartidos (`App.jsx`, `methods.js`, `MethodPanel.jsx`, `modules/index.js`, `App.css`, `index.css`) se cambian solo si es necesario y avisando al otro integrante.
- Los estilos de cada método usan su propio prefijo de clase (`.simplex-`, `.noroeste-`, `.minimos-`).
- Se recomienda trabajar en ramas separadas y unirlas a `main` una vez probadas.

## Licencia

Proyecto académico desarrollado para la materia de Investigación de Operaciones.