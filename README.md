# Calendar

Aplicación web de calendario desarrollada como proyecto universitario. Su objetivo es ofrecer una forma sencilla y visual de organizar actividades personales, académicas y laborales.

## Estado actual

Los módulos Calendario y Configuración están disponibles. El calendario cuenta con vistas funcionales de Mes, Semana y Día; Configuración permite elegir el primer día de la semana y administrar categorías persistentes. Los módulos de gestión de eventos y Mis eventos aún no están disponibles.

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
- Semanas configurables para iniciar en lunes o domingo y completadas con fechas de los meses adyacentes.
- Vista semanal con siete columnas y cuadrícula horaria.
- Vista diaria con una línea de tiempo para la fecha seleccionada.
- Navegación anterior y siguiente adaptada a Mes, Semana o Día.
- Botón para regresar a la fecha actual en cualquier vista.
- Resaltado del día actual y de la fecha seleccionada.
- Posicionamiento de eventos según su hora y duración.
- Distribución en columnas cuando existen eventos superpuestos.
- Ampliación automática del horario para eventos fuera de 07:00 a 22:00.
- Diseño responsive con sidebar, categorías y panel derecho sincronizado.
- Mini calendario con navegación compartida que resalta un día en Mes/Día y la semana completa en Semana.
- Lista del panel derecho filtrada por el mes, la semana o el día visible.
- Lectura segura de eventos desde `localStorage` mediante la clave `calendario_eventos`.
- Estado vacío cuando no existen eventos registrados.
- Pantalla Configuración accesible desde el menú principal.
- Preferencias persistentes mediante la clave `calendario_configuracion`.
- Creación, edición y eliminación segura de categorías mediante `calendario_categorias`.
- Bloqueo de eliminación cuando una categoría tiene eventos asociados.
- Colores y nombres de categorías compartidos por el sidebar y las vistas de eventos.

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
    ├── assets/
    │   └── icons/
    │       └── trash.svg
    ├── js/
    │   ├── calendar-view.js
    │   ├── category-storage.js
    │   ├── confirmation-dialog.js
    │   ├── date-utils.js
    │   ├── event-storage.js
    │   ├── mini-calendar-view.js
    │   ├── settings-storage.js
    │   ├── settings-view.js
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
- `src/assets/icons/trash.svg`: icono de papelera utilizado para eliminar categorías desde el sidebar.
- `src/js/date-utils.js`: cálculos, comparación y formato de fechas.
- `src/js/event-storage.js`: lectura y validación de eventos almacenados.
- `src/js/calendar-view.js`: renderizado de la cuadrícula mensual.
- `src/js/category-storage.js`: fuente única, validación y persistencia de categorías.
- `src/js/confirmation-dialog.js`: confirmación modal accesible y reutilizable para acciones destructivas.
- `src/js/mini-calendar-view.js`: mini calendario sincronizado del panel derecho.
- `src/js/settings-storage.js`: lectura, normalización y escritura de preferencias.
- `src/js/settings-view.js`: pantalla Configuración y modal de categorías.
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
2. `settings-storage.js`, `category-storage.js` y `event-storage.js` publican el acceso centralizado a datos locales.
3. Los archivos `*-view.js` publican las vistas y los cálculos de presentación.
4. `confirmation-dialog.js` publica el diálogo reutilizable para acciones destructivas.
5. `script.js` recupera preferencias, categorías y eventos, crea el estado principal, conecta la navegación y ejecuta el primer renderizado.

### Estado principal

`script.js` conserva un único objeto `state` con estas propiedades:

- `activeModule`: módulo visible; admite `calendar` o `settings`.
- `activeView`: vista activa; admite `month`, `week` o `day`.
- `categories`: categorías válidas recuperadas de `localStorage` o de los tokens CSS oficiales.
- `events`: eventos válidos recuperados desde `localStorage` al iniciar.
- `settings`: tema e inicio de semana normalizados.
- `selectedDate`: fecha seleccionada y referencia para las vistas Semana y Día.
- `visibleMonth`: mes mostrado en la vista mensual.

La función `render()` sincroniza el módulo activo, las categorías del sidebar, el selector de vistas, los textos accesibles de navegación, el panel central, el mini calendario y la lista de eventos del periodo. La navegación anterior/siguiente cambia un mes, siete días o un día según la vista activa. El botón **Hoy** restablece `selectedDate` y `visibleMonth` usando la fecha local del navegador.

### Responsabilidad de los módulos

#### `script.js`

Es el coordinador de la aplicación. Crea las instancias de las vistas, administra el estado, conecta Calendario con Configuración y persiste los resultados de las operaciones. No contiene cálculos de calendario ni genera por sí mismo el marcado de los eventos.

#### `src/js/date-utils.js`

Centraliza la lógica de fechas:

- crea fechas locales a mediodía para evitar cambios accidentales por zona horaria;
- convierte fechas entre objetos `Date` y claves `YYYY-MM-DD`;
- valida claves de fecha sin aceptar fechas inexistentes;
- calcula el inicio del mes, el inicio configurable de cada semana y los siete días semanales;
- genera las fechas necesarias para completar la cuadrícula mensual;
- compara días y meses;
- produce títulos y etiquetas en español de Colombia mediante `Intl.DateTimeFormat`.

#### `src/js/event-storage.js`

Lee la clave `calendario_eventos` de `localStorage`, convierte el JSON y descarta registros inválidos sin interrumpir la interfaz. También normaliza campos opcionales y ofrece ordenamiento cronológico. En este momento el módulo solo lee y ordena; la escritura, edición y eliminación se implementarán junto con la gestión de eventos.

#### `src/js/settings-storage.js`

Gestiona la clave `calendario_configuracion`. La estructura normalizada es `{ "theme": "light", "firstDayOfWeek": "monday" }`; `theme` admite `light`, `dark`, `midnight`, `forest`, `lavender`, `sakura`, `sand` o `graphite`, mientras que `firstDayOfWeek` admite `monday` o `sunday`. El tema seleccionado se aplica mediante `data-theme` en el elemento raíz. Los datos ausentes, inválidos o inaccesibles regresan a los valores predeterminados sin bloquear la aplicación ni escribir automáticamente sobre el almacenamiento.

#### `src/js/category-storage.js`

Gestiona la clave `calendario_categorias`. Las cinco categorías iniciales leen su color desde `--category-university`, `--category-work`, `--category-personal`, `--category-health` y `--category-other`. Cada categoría contiene `id`, `name`, `color` y `aliases`. El ID no cambia al editar; `aliases` conserva nombres anteriores para mantener relacionados los eventos antiguos que todavía solo guardan `categoria`. El módulo valida nombres, duplicados y colores, y resuelve una categoría por `categoriaId` o, por compatibilidad, por nombre o alias.

#### `src/js/confirmation-dialog.js`

Implementa un diálogo accesible y reutilizable para acciones destructivas. `open()` recibe título, mensaje, descripción, etiqueta de confirmación, elemento disparador y una función `onConfirm`. Solo ejecuta esa función al confirmar; si devuelve `{ ok: false, error }`, conserva el modal abierto y muestra el error. Gestiona Escape, clic en el fondo, ciclo de foco con Tab, bloqueo del desplazamiento y restauración del foco. Una futura eliminación de eventos puede reutilizar la misma instancia entregando otro contenido y otra función `onConfirm`.

#### `src/js/settings-view.js`

Renderiza Apariencia y Categorías, sincroniza la lista del sidebar y controla el modal compartido de creación y edición. En el sidebar, cada categoría conserva una superficie blanca que se desplaza suavemente al pasar el mouse o recibir foco para revelar, únicamente a la derecha, un área gris con la papelera roja cargada desde `src/assets/icons/trash.svg`. La eliminación abre `ConfirmationDialog` con el nombre real de la categoría y solo llama a la acción coordinada después de confirmar. Presenta los errores de validación y persistencia en regiones accesibles; `script.js` impide la operación cuando existen eventos asociados.

#### `src/js/calendar-view.js`

Implementa la vista Mes. Agrupa los eventos por fecha, construye un botón accesible por cada día, distingue días externos al mes, el día actual y la selección activa. Muestra como máximo dos eventos por celda y agrega un contador cuando existen más. Reordena el encabezado y la cuadrícula con la preferencia semanal y consulta la fuente compartida de categorías.

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

Renderiza la cuadrícula horaria reutilizada por las vistas Semana y Día. Filtra los eventos de las fechas visibles, crea encabezados y columnas, posiciona cada evento con los cálculos de `timeline-utils.js` y dibuja un indicador de la hora actual cuando corresponde. Semana respeta el inicio configurado; Día no necesita reordenamiento. Si el evento contiene `ubicacion`, la muestra dentro del bloque.

#### `src/js/mini-calendar-view.js`

Renderiza el mini calendario del panel derecho con el mismo estado de la vista principal. En Mes y Día resalta solamente `selectedDate`; en Semana reutiliza `getWeekDates()` para marcar los siete días configurados como una banda continua y distingue `selectedDate` con un azul más intenso. Usa `visibleMonth` en la vista Mes y el mes de `selectedDate` en Semana o Día, incluyendo correctamente los días adyacentes cuando la semana cruza de mes. Sus flechas reutilizan la navegación principal y el encabezado indica la vista activa.

#### `src/js/upcoming-events-view.js`

Filtra y ordena los eventos correspondientes al periodo activo: el mes visible en Mes, los siete días seleccionados en Semana o la fecha seleccionada en Día. Presenta el total y cada evento como una fila identificada por el color de su categoría. Cuando no hay resultados genera un estado vacío accesible. Esta vista no altera los datos almacenados.

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
  "categoriaId": "universidad",
  "categoria": "Universidad",
  "ubicacion": "Aula 204"
}
```

`id`, `titulo` y una `fecha` válida son obligatorios para que el evento sea leído. Los demás campos se normalizan como texto vacío cuando faltan; `categoria` usa `Otros` como valor predeterminado. `categoriaId` es opcional por compatibilidad con registros existentes, pero la futura gestión de eventos deberá guardarlo para conservar la relación estable cuando cambie el nombre visible.

### Cómo probar Configuración

1. Abre **Configuración** desde el menú lateral.
2. Cambia **Primer día de la semana** a Domingo, vuelve a Calendario y revisa Mes, Semana y el mini calendario. Recarga la página para comprobar la persistencia.
3. Pulsa **Nueva categoría** o el botón `+` del sidebar, completa nombre y color y guarda.
4. Edita la categoría creada y confirma que el nombre y el color cambian también en el sidebar.
5. Elimina una categoría sin eventos y confirma el mensaje de éxito.
6. Intenta eliminar una categoría referenciada por un evento almacenado; debe conservarse y mostrarse el aviso para reasignar primero sus eventos.
7. Abre otra confirmación y prueba **Cancelar**, la X, clic en el fondo y Escape; ninguna opción debe eliminar la categoría y el foco debe regresar a la papelera utilizada.

### Renderizado y seguridad de contenido

Las vistas generan elementos mediante la API del DOM y asignan los datos de eventos con `textContent`. De esta forma, los títulos, descripciones o ubicaciones almacenados no se interpretan como HTML. El SVG del estado vacío es contenido fijo definido por la propia aplicación.

### Limitaciones actuales del JavaScript

- Los eventos se cargan una sola vez al iniciar la página; todavía no existe un flujo para volver a leerlos durante la sesión.
- Aún no se implementaron las operaciones de crear, editar y eliminar.
- Los eventos mostrados todavía no permiten abrir una vista de detalle.
- La búsqueda, los filtros y la pantalla **Mis eventos** siguen pendientes.
- El selector de tema muestra Oscuro como opción futura y permanece deshabilitado; solo existe el tema claro.
- El proyecto todavía no cuenta con una suite de pruebas automatizada configurada.

## Pendiente

- Formulario para crear eventos.
- Consulta, edición y eliminación de eventos.
- Módulo Mis eventos.
