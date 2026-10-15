# Calendar

Aplicación web de calendario desarrollada como proyecto universitario. Su objetivo es ofrecer una forma sencilla y visual de organizar actividades personales, académicas y laborales.

## Estado actual

El proyecto se encuentra en su etapa de configuración inicial. Por el momento, el repositorio contiene únicamente la estructura base y las variables de color; las vistas y funcionalidades del calendario todavía no han sido desarrolladas.

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

## Estructura inicial

```text
calendar/
├── index.html
├── README.md
├── script.js
└── src/
    └── styles/
        └── variables.css
```

- `index.html`: estructura HTML inicial, todavía sin interfaz.
- `script.js`: archivo reservado para la lógica futura; actualmente está vacío.
- `src/styles/variables.css`: paleta de colores oficial del proyecto mediante variables CSS.
