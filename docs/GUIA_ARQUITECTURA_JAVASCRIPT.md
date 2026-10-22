# Guía conceptual de la arquitectura JavaScript

Esta guía explica cómo está organizado el JavaScript de **Mi Calendario**. No busca describir cada línea, sino aclarar los conceptos y patrones principales para que sea más fácil leer, modificar y ampliar el proyecto.

## 1. La idea general

La aplicación está construida con JavaScript nativo, sin frameworks. Su funcionamiento puede resumirse así:

1. Los archivos pequeños definen herramientas, almacenamiento y vistas.
2. Esos archivos publican sus elementos en `window.CalendarApp`.
3. `script.js` obtiene esos elementos y crea las instancias principales.
4. Un objeto `state` conserva el estado actual de la aplicación.
5. La función `render()` sincroniza la interfaz con ese estado.
6. Los eventos del usuario modifican el estado y vuelven a ejecutar `render()`.

En forma de flujo:

```text
Usuario hace clic
       ↓
Se ejecuta un manejador
       ↓
Se modifica state
       ↓
Se llama render()
       ↓
La pantalla refleja el nuevo estado
```

## 2. ¿Qué es `window`?

En el navegador, `window` es el objeto global. Representa la ventana o pestaña donde se ejecuta la página y contiene APIs como:

```js
window.document
window.localStorage
window.setTimeout
```

Cuando se crea una propiedad en `window`, otros archivos JavaScript cargados en la misma página pueden acceder a ella.

## 3. ¿Qué es `window.CalendarApp`?

`window.CalendarApp` es un objeto creado por el proyecto para reunir sus herramientas bajo un solo nombre. Se conoce como un **namespace** o espacio de nombres.

En vez de crear muchas variables globales independientes:

```js
window.CalendarView = CalendarView;
window.readEvents = readEvents;
window.DateUtils = DateUtils;
```

se agrupan así:

```js
window.CalendarApp = {
  CalendarView,
  readEvents,
  DateUtils,
};
```

Por tanto, `CalendarApp` no es una clase especial ni una característica del navegador. Es simplemente el nombre elegido para el objeto global del proyecto.

Su función es parecida a una caja de herramientas:

```text
window.CalendarApp
├── CalendarView
├── WeekView
├── DayView
├── SettingsView
├── DateUtils
├── readEvents
└── readCategories
```

### Cómo varios archivos agregan herramientas

Cada archivo conserva lo que ya existe y añade sus propias exportaciones:

```js
global.CalendarApp = {
  ...global.CalendarApp,
  CalendarView,
};
```

El operador `...` copia las propiedades anteriores. Sin él, un archivo podría reemplazar accidentalmente todo lo que registraron los archivos cargados antes.

Después, `script.js` puede extraer lo que necesita:

```js
const {
  CalendarView,
  DateUtils,
  readEvents,
} = window.CalendarApp;
```

Esto se llama **desestructuración de objetos**.

## 4. Las funciones autoejecutables o IIFE

Los módulos del proyecto usan una estructura parecida a esta:

```js
(function (global) {
  // Código privado del archivo

  global.CalendarApp = {
    ...global.CalendarApp,
    herramientaPublica,
  };
}(window));
```

Se llama **IIFE**: *Immediately Invoked Function Expression*, o función que se ejecuta inmediatamente.

Tiene dos objetivos principales:

- Crear un espacio privado para variables y funciones internas.
- Publicar únicamente lo que otros archivos necesitan usar.

Aquí `global` recibe el valor de `window`. Usar ese parámetro hace explícito que el archivo trabajará con el objeto global, pero evita repetir `window` dentro de todo el módulo.

Este patrón era muy común antes de los módulos modernos de JavaScript (`import` y `export`) y sigue siendo útil en proyectos que se ejecutan directamente en el navegador sin herramientas de compilación.

## 5. Por qué importa el orden de los `<script>`

Los archivos se cargan con `defer`. Esto permite descargar el JavaScript sin bloquear la lectura del HTML y ejecutarlo cuando el documento ya fue analizado.

Los scripts con `defer` mantienen su orden. Por eso, los archivos que registran herramientas en `CalendarApp` deben aparecer antes de `script.js`:

```html
<script src="src/js/date-utils.js" defer></script>
<script src="src/js/event-storage.js" defer></script>
<script src="src/js/calendar-view.js" defer></script>
<script src="script.js" defer></script>
```

Cuando se ejecuta `script.js`, las dependencias anteriores ya deben existir en `window.CalendarApp`.

## 6. El estado central: `state`

El objeto `state` contiene la información que describe la situación actual de la aplicación:

```js
const state = {
  activeModule: "calendar",
  activeView: "month",
  categories: [],
  events: [],
  selectedDate: new Date(),
  settings: {},
  visibleMonth: new Date(),
};
```

La idea importante es separar:

- **Datos y decisiones actuales:** `state`.
- **Elementos visibles del HTML:** el DOM.

Por ejemplo, si el usuario selecciona la vista semanal, primero cambia el dato:

```js
state.activeView = "week";
```

Luego la interfaz se actualiza desde ese dato:

```js
render();
```

Esta organización evita que distintas partes del programa intenten decidir por separado cuál vista está activa.

## 7. ¿Qué significa `render()`?

`render` no es una palabra reservada de JavaScript. Es un nombre convencional que significa **representar visualmente unos datos**.

Una función de renderizado normalmente:

1. Lee el estado actual.
2. Decide qué contenido debe mostrarse.
3. Actualiza o reconstruye elementos del DOM.
4. Aplica clases, textos, fechas, eventos y estilos necesarios.

Ejemplo conceptual:

```js
function render() {
  if (state.activeView === "month") {
    monthView.render(state);
  }

  if (state.activeView === "week") {
    weekView.render(state);
  }

  if (state.activeView === "day") {
    dayView.render(state);
  }
}
```

En esta aplicación, `render()` cumple un papel parecido al que realizan React, Vue u otros frameworks, pero está implementado manualmente.

### Renderizar no significa recargar la página

`render()` no vuelve a solicitar el HTML al servidor. Modifica el DOM que ya existe mediante métodos como:

```js
element.textContent = "Nuevo texto";
element.classList.toggle("is-active", condition);
container.replaceChildren(newContent);
```

## 8. Las clases de vista

Clases como `CalendarView`, `WeekView`, `DayView` o `SettingsView` encapsulan una parte de la interfaz.

Una vista suele reunir:

- Referencias a sus elementos HTML.
- Los eventos que escucha.
- La lógica necesaria para pintar su contenido.
- Métodos públicos que usa el coordinador.

Ejemplo simplificado:

```js
class WeekView {
  constructor(options) {
    this.container = options.container;
    this.onSelectDate = options.onSelectDate;
  }

  render(data) {
    // Actualiza la semana usando los datos recibidos.
  }
}
```

El beneficio es que `script.js` no necesita conocer todos los detalles HTML de cada vista. Solo le entrega datos y recibe acciones mediante callbacks.

## 9. Instancias y `new`

Una clase es una plantilla. Una instancia es el objeto concreto creado a partir de esa plantilla:

```js
const weekView = new WeekView(options);
```

Al usar `new` ocurre, de forma simplificada, lo siguiente:

1. Se crea un objeto nuevo.
2. Se ejecuta el `constructor` de la clase.
3. `this` apunta a ese objeto nuevo.
4. El objeto queda conectado con los métodos de la clase.

Así, cada instancia mantiene sus propias referencias y configuración.

## 10. Inyección de dependencias mediante `options`

Las vistas reciben un objeto de configuración:

```js
const view = new SettingsView({
  categoryStorage,
  confirmationDialog,
  onCategoriesChange,
});
```

Esto se conoce como **inyección de dependencias**. La vista no crea por sí sola todo lo que utiliza; el coordinador se lo entrega.

Ventajas:

- Reduce el acoplamiento entre archivos.
- Hace explícito qué necesita cada componente.
- Permite reemplazar una dependencia sin reescribir la vista.
- Facilita las pruebas.

A veces el constructor usa:

```js
Object.assign(this, options);
```

Esto copia las propiedades de `options` dentro de la instancia. Es una forma corta de escribir varias asignaciones:

```js
this.categoryStorage = options.categoryStorage;
this.confirmationDialog = options.confirmationDialog;
this.onCategoriesChange = options.onCategoriesChange;
```

## 11. Callbacks: funciones entregadas a otras funciones

En JavaScript las funciones son valores. Pueden guardarse en variables, enviarse como argumentos y devolverse como resultado.

```js
function handleCategoryChange(categories) {
  state.categories = categories;
  render();
}

const settingsView = new SettingsView({
  onCategoriesChange: handleCategoryChange,
});
```

`SettingsView` no necesita saber cómo administra el estado `script.js`. Solo llama:

```js
this.onCategoriesChange(updatedCategories);
```

Esa función entregada para ejecutarse después se llama **callback**.

También aparecen funciones flecha:

```js
button.addEventListener("click", () => {
  state.activeView = "week";
  render();
});
```

La función no se ejecuta al registrarla. El navegador la guarda y la llama cuando ocurre el clic.

## 12. Formas de declarar funciones

El proyecto puede usar distintas sintaxis que representan ideas similares.

### Declaración tradicional

```js
function render() {
  // ...
}
```

### Expresión de función

```js
const render = function () {
  // ...
};
```

### Función flecha

```js
const render = () => {
  // ...
};
```

Las funciones flecha son más compactas, pero no crean su propio `this`. Por eso son muy útiles en callbacks, mientras que los métodos de clase suelen escribirse con la sintaxis normal de método.

## 13. Métodos de arreglos utilizados con frecuencia

Estos métodos reciben callbacks y producen resultados sin tener que escribir siempre un ciclo `for` manual.

### `map`

Transforma cada elemento y devuelve un arreglo nuevo:

```js
const names = categories.map((category) => category.name);
```

### `filter`

Conserva solamente los elementos que cumplen una condición:

```js
const eventsForDay = events.filter((event) => event.date === selectedDate);
```

### `find`

Devuelve el primer elemento que coincide:

```js
const selectedEvent = events.find((event) => event.id === eventId);
```

### `some`

Indica si al menos un elemento cumple la condición:

```js
const hasEvents = events.some((event) => event.categoryId === categoryId);
```

### `sort`

Ordena un arreglo. Es importante saber que modifica el arreglo sobre el que se ejecuta; por eso suele copiarse antes:

```js
const sortedEvents = [...events].sort(compareEvents);
```

## 14. Objetos inmutables con `Object.freeze`

`Object.freeze` impide modificar directamente un objeto:

```js
const VIEW_TYPES = Object.freeze({
  MONTH: "month",
  WEEK: "week",
  DAY: "day",
});
```

Se utiliza para constantes agrupadas. Ayuda a evitar cambios accidentales, aunque el congelamiento es superficial: no congela automáticamente objetos internos anidados.

## 15. Métodos del DOM que pueden parecer nuevos

### `querySelector`

Busca el primer elemento que coincida con un selector CSS:

```js
const calendar = document.querySelector("#calendar");
```

### `createElement`

Crea un elemento en memoria:

```js
const button = document.createElement("button");
```

Todavía no aparece en pantalla hasta insertarlo.

### `append`

Inserta uno o varios nodos:

```js
container.append(button);
```

### `replaceChildren`

Elimina los hijos actuales y coloca los nuevos:

```js
container.replaceChildren(fragment);
```

Es muy útil para renderizar de nuevo una lista sin conservar contenido anterior.

### `classList.toggle`

Agrega o elimina una clase según una condición:

```js
button.classList.toggle("is-active", isSelected);
```

### `dataset`

Permite leer y escribir atributos `data-*`:

```html
<button data-view="week">Semana</button>
```

```js
const viewName = button.dataset.view;
```

## 16. `localStorage` y la persistencia

`localStorage` permite conservar texto en el navegador incluso después de recargar la página.

```js
localStorage.setItem("clave", "valor");
const value = localStorage.getItem("clave");
```

Como solamente guarda cadenas de texto, los objetos y arreglos se convierten con JSON:

```js
localStorage.setItem("categorias", JSON.stringify(categories));

const storedCategories = JSON.parse(
  localStorage.getItem("categorias") || "[]"
);
```

Los módulos de almacenamiento del proyecto no se limitan a leer JSON. También normalizan y validan los datos para evitar que información incompleta o dañada rompa las vistas.

## 17. Normalización y validación

La **validación** pregunta si un dato es aceptable. La **normalización** lo convierte a la forma establecida por el proyecto.

Ejemplo conceptual:

```js
function normalizeName(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}
```

Esto permite que el resto de la aplicación trabaje con datos previsibles. Es especialmente importante al recuperar información de `localStorage`, porque el contenido pudo haber sido creado por una versión anterior o modificado manualmente.

## 18. Fechas e `Intl.DateTimeFormat`

`Intl.DateTimeFormat` es una API estándar del navegador para mostrar fechas según un idioma y una región:

```js
const formatter = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

formatter.format(new Date());
```

Esto evita construir manualmente nombres de meses y formatos. También explica por qué el proyecto centraliza muchas operaciones en `DateUtils`: las fechas tienen zonas horarias, formatos y límites que conviene manejar desde un solo lugar.

## 19. `async` y `await`

Una función marcada como `async` siempre devuelve una promesa y permite usar `await`:

```js
async function removeCategory() {
  const result = await requestDeletion();
  return result;
}
```

`await` pausa solamente esa función hasta obtener el resultado; no congela toda la página.

Este patrón es útil cuando una acción puede tardar o debe esperar una confirmación. El diálogo personalizado, por ejemplo, puede ejecutar un callback de confirmación y esperar su resultado antes de decidir si se cierra o muestra un error.

## 20. Flujo completo al cambiar de vista

Un cambio de Mes a Semana ocurre conceptualmente así:

```text
1. El usuario pulsa “Semana”.
2. El navegador ejecuta el listener del botón.
3. El listener cambia state.activeView a "week".
4. Se llama render().
5. render() selecciona WeekView.
6. WeekView recibe fechas, eventos y categorías.
7. WeekView reconstruye o actualiza su parte del DOM.
8. Los controles y el panel derecho se sincronizan.
```

La vista no debe convertirse en la fuente principal del estado. El estado cambia primero y la interfaz se deriva de él.

## 21. Flujo completo al eliminar una categoría

El recorrido conceptual es:

```text
1. El usuario pasa el cursor sobre la categoría.
2. CSS revela el botón de eliminar.
3. El usuario pulsa el botón.
4. SettingsView solicita abrir ConfirmationDialog.
5. El usuario confirma.
6. Se valida si la categoría puede eliminarse.
7. CategoryStorage actualiza localStorage.
8. El callback comunica las categorías nuevas a script.js.
9. script.js actualiza state.categories.
10. render() sincroniza todas las vistas.
```

Aquí participan varias responsabilidades diferentes:

- CSS controla la animación visual.
- `SettingsView` maneja la interacción.
- `ConfirmationDialog` maneja la confirmación accesible.
- `CategoryStorage` valida y persiste.
- `script.js` coordina el estado general.
- `render()` actualiza la pantalla.

## 22. Responsabilidad de cada capa

### `window.CalendarApp`

Registro global de clases, funciones y utilidades compartidas.

### `script.js`

Coordinador principal. Crea instancias, conserva el estado y conecta unas partes con otras.

### `state`

Fuente de verdad sobre la situación actual de la aplicación.

### Vistas

Representan los datos en el DOM y notifican las acciones del usuario mediante callbacks.

### Módulos de almacenamiento

Leen, validan, normalizan y guardan datos persistentes.

### Utilidades

Resuelven operaciones reutilizables, como cálculos de fechas y horas.

### `render()`

Puente entre el estado de JavaScript y lo que el usuario ve.

## 23. Comparación con un framework

Aunque el proyecto no usa React, hay conceptos equivalentes:

| Proyecto actual | Concepto aproximado en React |
| --- | --- |
| `state` | Estado del componente o de la aplicación |
| `render()` | Renderizado provocado por un cambio de estado |
| Clases de vista | Componentes |
| Objeto `options` | Propiedades o dependencias |
| Callbacks | Manejadores enviados como propiedades |
| `window.CalendarApp` | Sistema manual de módulos/importaciones |

La diferencia principal es que aquí la aplicación controla directamente el DOM. En un framework, gran parte de esa sincronización es automática.

## 24. Modelo mental recomendado

Para leer el código, conviene hacerse estas preguntas en orden:

1. ¿Qué acción realizó el usuario?
2. ¿Qué listener recibe esa acción?
3. ¿Qué valor del `state` cambia?
4. ¿Qué callback comunica el cambio?
5. ¿Quién guarda el dato si debe persistir?
6. ¿Qué vista recibe el nuevo estado?
7. ¿Qué parte del DOM modifica su método `render()`?

La relación más importante para recordar es:

```text
window.CalendarApp = herramientas disponibles
state              = información actual
script.js          = coordinador
render()           = sincronización visual
localStorage       = persistencia en el navegador
```

Con este modelo, los métodos individuales dejan de parecer piezas aisladas y se entienden como partes de un mismo ciclo: **acción → cambio de estado → persistencia cuando corresponde → renderizado**.
