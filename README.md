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

## Tecnologías previstas

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

## Pendiente

- Formulario para crear eventos.
- Consulta, edición y eliminación de eventos.
- Módulo Mis eventos.
- Preferencias básicas de Configuración.
