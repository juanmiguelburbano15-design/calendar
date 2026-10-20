# Calendar

Aplicación web de calendario desarrollada como proyecto universitario. Su objetivo es ofrecer una forma sencilla y visual de organizar actividades personales, académicas y laborales.

## Estado actual

El módulo Calendario ya cuenta con vistas funcionales de Mes, Semana y Día. La aplicación permite navegar por cada periodo, regresar a la fecha de hoy y conservar la fecha seleccionada al cambiar de vista. Los módulos de gestión de eventos, Mis eventos y Configuración aún no están disponibles.

## Objetivo del MVP

El Producto Mínimo Viable permitirá:

- Consultar un calendario mensual y navegar entre meses.
- Identificar el día actual y visualizar eventos por fecha.
- Crear, consultar, editar y eliminar eventos.
- Asignar título, descripción, fecha, hora y categoría a cada evento.
- Buscar eventos por nombre y filtrarlos por categoría.
- Guardar los datos localmente en el navegador.

Las categorías previstas son Universidad, Trabajo, Personal, Salud y Otros.

## Tecnologías utilizadas

- HTML.
- CSS.
- JavaScript.
- `localStorage` para la persistencia de datos.

El MVP no utilizará backend, base de datos, autenticación ni dependencias externas innecesarias.

## Funcionalidad disponible

- Calendario mensual generado a partir de la fecha real del sistema.
- Semanas iniciadas en lunes y completadas con fechas de los meses adyacentes.
- Vista semanal con siete columnas y cuadrícula horaria.
- Vista diaria con una línea de tiempo para la fecha seleccionada.
- Navegación anterior y siguiente adaptada a Mes, Semana o Día.
- Botón para regresar a la fecha actual en cualquier vista.
- Resaltado del día actual y de la fecha seleccionada.
- Posicionamiento de eventos según su hora y duración.
- Distribución en columnas cuando existen eventos superpuestos.
- Ampliación automática del horario para eventos fuera de 07:00 a 22:00.
- Diseño responsive con sidebar, categorías y panel de próximos eventos.
- Lectura segura de eventos desde `localStorage` mediante la clave `calendario_eventos`.
- Estado vacío cuando no existen eventos registrados.

La aplicación no inserta eventos de demostración en el navegador.

## Ejecución

No es necesario instalar dependencias. Abre `index.html` en un navegador web moderno para utilizar el módulo.

## Estructura inicial

```text
calendar/
├── index.html
├── README.md
├── script.js
└── src/
    ├── js/
    │   ├── calendar-view.js
    │   ├── date-utils.js
    │   ├── event-storage.js
    │   ├── time-grid-view.js
    │   ├── timeline-utils.js
    │   └── upcoming-events-view.js
    └── styles/
        ├── calendar-views.css
        ├── main.css
        └── variables.css
```

- `index.html`: estructura semántica de la interfaz.
- `script.js`: estado principal y coordinación de las vistas.
- `src/js/date-utils.js`: cálculos, comparación y formato de fechas.
- `src/js/event-storage.js`: lectura y validación de eventos almacenados.
- `src/js/calendar-view.js`: renderizado de la cuadrícula mensual.
- `src/js/timeline-utils.js`: intervalos horarios, posiciones y solapamientos.
- `src/js/time-grid-view.js`: renderizado reutilizable de Semana y Día.
- `src/js/upcoming-events-view.js`: estado vacío y listado cronológico de próximos eventos.
- `src/styles/calendar-views.css`: estilos encapsulados de las vistas del calendario.
- `src/styles/main.css`: estilos responsive de la aplicación.
- `src/styles/variables.css`: paleta de colores oficial del proyecto mediante variables CSS.

## Arquitectura JavaScript

El código JavaScript se ejecuta directamente en el navegador, sin framework, paquetes ni proceso de compilación. Cada archivo registra sus utilidades o clases en el objeto global `window.CalendarApp`. El orden de las etiquetas `<script defer>` de `index.html` es importante: primero se cargan las dependencias y al final `script.js`, que inicia la aplicación.

### Flujo de inicialización

1. `date-utils.js` publica las operaciones de fecha.
2. `event-storage.js` publica la lectura y ordenamiento de eventos.
3. `calendar-view.js`, `timeline-utils.js`, `time-grid-view.js` y `upcoming-events-view.js` publican las vistas y cálculos de presentación.
4. `script.js` lee los eventos guardados, crea el estado principal, conecta los botones y ejecuta el primer renderizado.

### Estado principal

`script.js` conserva un único objeto `state` con estas propiedades:

- `activeView`: vista activa; admite `month`, `week` o `day`.
- `events`: eventos válidos recuperados desde `localStorage` al iniciar.
- `selectedDate`: fecha seleccionada y referencia para las vistas Semana y Día.
- `visibleMonth`: mes mostrado en la vista mensual.

La función `render()` sincroniza el selector de vistas, los textos accesibles de navegación, el panel central y la lista de próximos eventos. La navegación anterior/siguiente cambia un mes, siete días o un día según la vista activa. El botón **Hoy** restablece `selectedDate` y `visibleMonth` usando la fecha local del navegador.

### Responsabilidad de los módulos

#### `script.js`

Es el coordinador de la aplicación. Crea las instancias de las vistas, administra el estado, responde a los controles de navegación y decide si debe renderizar la cuadrícula mensual o la línea de tiempo. No contiene cálculos de calendario ni genera por sí mismo el marcado de los eventos.

#### `src/js/date-utils.js`

Centraliza la lógica de fechas:

- crea fechas locales a mediodía para evitar cambios accidentales por zona horaria;
- convierte fechas entre objetos `Date` y claves `YYYY-MM-DD`;
- valida claves de fecha sin aceptar fechas inexistentes;
- calcula el inicio del mes, el lunes de cada semana y los siete días semanales;
- genera las fechas necesarias para completar la cuadrícula mensual;
- compara días y meses;
- produce títulos y etiquetas en español de Colombia mediante `Intl.DateTimeFormat`.

#### `src/js/event-storage.js`

Lee la clave `calendario_eventos` de `localStorage`, convierte el JSON y descarta registros inválidos sin interrumpir la interfaz. También normaliza campos opcionales y ofrece ordenamiento cronológico. En este momento el módulo solo lee y ordena; la escritura, edición y eliminación se implementarán junto con la gestión de eventos.

#### `src/js/calendar-view.js`

Implementa la vista Mes. Agrupa los eventos por fecha, construye un botón accesible por cada día, distingue días externos al mes, el día actual y la selección activa. Muestra como máximo dos eventos por celda y agrega un contador cuando existen más. También normaliza las categorías para asociarlas con sus clases visuales.

#### `src/js/timeline-utils.js`

Contiene los cálculos compartidos por Semana y Día:

- valida horas en formato de 24 horas;
- convierte horas a minutos;
- asigna una hora de duración cuando un evento no tiene una hora final válida;
- amplía el intervalo visible fuera del rango predeterminado de 07:00 a 22:00;
- genera las marcas horarias;
- calcula posición y altura de cada bloque;
- reparte eventos superpuestos en carriles para que permanezcan visibles.

#### `src/js/time-grid-view.js`

Renderiza la cuadrícula horaria reutilizada por las vistas Semana y Día. Filtra los eventos de las fechas visibles, crea encabezados y columnas, posiciona cada evento con los cálculos de `timeline-utils.js` y dibuja un indicador de la hora actual cuando corresponde. Si el evento contiene `ubicacion`, la muestra dentro del bloque.

#### `src/js/upcoming-events-view.js`

Ordena y muestra los eventos cuya fecha es igual o posterior al día actual. Cuando no hay resultados genera un estado vacío accesible. Esta vista no altera los datos almacenados.

### Formato actual de un evento

Los eventos se guardan como un arreglo JSON bajo la clave `calendario_eventos`. Cada registro utiliza esta estructura:

```json
{
  "id": "identificador-estable",
  "titulo": "Clase de Cálculo",
  "descripcion": "Repasar integrales",
  "fecha": "2026-10-19",
  "horaInicio": "08:00",
  "horaFin": "10:00",
  "categoria": "Universidad",
  "ubicacion": "Aula 204"
}
```

`id`, `titulo` y una `fecha` válida son obligatorios para que el evento sea leído. Los demás campos se normalizan como texto vacío cuando faltan; `categoria` usa `Otros` como valor predeterminado. Las categorías visuales reconocidas son Universidad, Trabajo, Personal, Salud y Otros.

### Renderizado y seguridad de contenido

Las vistas generan elementos mediante la API del DOM y asignan los datos de eventos con `textContent`. De esta forma, los títulos, descripciones o ubicaciones almacenados no se interpretan como HTML. El SVG del estado vacío es contenido fijo definido por la propia aplicación.

### Limitaciones actuales del JavaScript

- Los eventos se cargan una sola vez al iniciar la página; todavía no existe un flujo para volver a leerlos durante la sesión.
- Aún no se implementaron las operaciones de crear, editar y eliminar.
- Los eventos mostrados todavía no permiten abrir una vista de detalle.
- La búsqueda, los filtros y las pantallas **Mis eventos** y **Configuración** siguen pendientes.
- El proyecto todavía no cuenta con una suite de pruebas automatizada configurada.

## Pendiente

- Formulario para crear eventos.
- Consulta, edición y eliminación de eventos.
- Módulo Mis eventos.
- Preferencias básicas de Configuración.
