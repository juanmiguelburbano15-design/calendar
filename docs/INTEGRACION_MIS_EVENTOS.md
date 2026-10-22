# Integración del módulo Mis Eventos

## 1. Descripción del módulo

**Mis Eventos** será el módulo central para consultar y administrar los eventos persistidos por **Mi Calendario**. Su alcance incluye encabezado, acción **Nuevo evento**, búsqueda, filtros, limpieza de filtros, tabla, total de resultados, cantidad por página y paginación.

La tabla debe usar datos reales de la aplicación. El diseño de referencia no es una fuente de datos. Este documento refleja el repositorio inspeccionado el 20 de octubre de 2026 y distingue lo existente de lo pendiente. Actualmente no existe la vista Mis Eventos, un formulario de eventos ni operaciones de escritura de eventos.

## 2. Arquitectura actual

La aplicación se ejecuta directamente en el navegador:

- HTML semántico en `index.html`.
- CSS en `src/styles/main.css` y `src/styles/calendar-views.css`.
- variables oficiales en `src/styles/variables.css`.
- JavaScript sin framework, paquetes ni compilación.
- módulos cargados con `<script defer>` que publican APIs en `window.CalendarApp`.
- `script.js` como coordinador del estado, navegación, persistencia y renderizado.
- `localStorage` como único almacenamiento.

El orden de scripts en `index.html` es contractual: las dependencias se cargan antes de `script.js`.

### Estado compartido

`script.js` mantiene un solo objeto:

```js
{
  activeModule,
  activeView,
  categories,
  events,
  selectedDate,
  settings,
  visibleMonth,
}
```

Los eventos se leen al iniciar con `eventStorage.readEvents()` y las categorías con `categoryStorage.readCategories()`. No existe biblioteca de estado ni bus de eventos: la sincronización interna consiste en actualizar `state` y ejecutar `render()`.

| Archivo | Responsabilidad actual |
| --- | --- |
| `src/js/calendar-view.js` | Agrupa y representa eventos en Mes. |
| `src/js/time-grid-view.js` | Representa eventos en Semana y Día. |
| `src/js/upcoming-events-view.js` | Filtra y ordena eventos del periodo para el panel derecho. |
| `src/js/timeline-utils.js` | Valida horas para la línea de tiempo y calcula intervalos y solapamientos. |
| `src/js/date-utils.js` | Valida claves de fecha y ofrece cálculos y formatos locales. |

## 3. Responsabilidades del compañero

1. Construir solo el contenido central de Mis Eventos.
2. Mostrar `state.events`, sin datos escritos directamente en el código.
3. Implementar búsqueda, filtros, orden y paginación como datos derivados, sin mutar la colección original.
4. Presentar un estado vacío real.
5. Integrar el módulo con la navegación existente.
6. Acordar e implementar escritura centralizada antes de habilitar crear, editar o eliminar.
7. Solicitar mutaciones al coordinador, actualizar `state.events` y renderizar todas las vistas.
8. Reutilizar categorías, fechas, botones y confirmaciones existentes.
9. Documentar contratos nuevos en JSDoc y `README.md`.

No debe reconstruir sidebar, Calendario, mini calendario, panel derecho, Configuración ni categorías.

## 4. Límites de modificación

### Archivos nuevos recomendados

Estos nombres son propuestas coherentes; todavía no existen:

- `src/js/my-events-view.js`: vista y estado local de búsqueda, filtros y paginación.
- `src/styles/my-events-view.css`: estilos encapsulados bajo `my-events-*`.

Si se incluye un formulario, su contrato debe acordarse primero: actualmente no existe un formulario reutilizable de eventos.

### Archivos compartidos que requieren coordinación

| Archivo | Cambio mínimo esperado | Riesgo |
| --- | --- | --- |
| `index.html` | Habilitar la navegación, añadir el `<main>` y cargar archivos nuevos. | Alto. |
| `script.js` | Admitir el módulo, instanciar su vista y coordinar mutaciones. | Alto. |
| `src/js/event-storage.js` | Añadir escritura segura antes del CRUD. | Alto. |
| `README.md` | Documentar módulo y APIs públicas. | Medio. |
| `AGENTS.md` | Actualizar la estructura local; está excluido de Git. | Bajo. |

### Archivos que no deben modificarse para construir la tabla

- `src/js/calendar-view.js`, `time-grid-view.js`, `timeline-utils.js`, `mini-calendar-view.js` y `upcoming-events-view.js`.
- `src/js/settings-view.js` y `settings-storage.js`.
- `src/js/category-storage.js`, salvo cambio contractual previamente acordado.
- `src/styles/calendar-views.css` y `src/styles/variables.css`.
- `src/assets/icons/trash.svg`.

La integración en `index.html` debe ser mínima; no se debe editar el contenido interno del sidebar ni del panel derecho.

## 5. Estructura de carpetas y archivos

```text
calendar/
├── index.html
├── script.js
├── README.md
├── docs/
│   └── INTEGRACION_MIS_EVENTOS.md
└── src/
    ├── assets/icons/trash.svg
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

Mantener un archivo JavaScript por responsabilidad y estilos propios encapsulados.

## 6. Contrato de eventos

El tipo real `CalendarEvent` está definido en `src/js/event-storage.js`:

```js
{
  id: "identificador-estable",
  titulo: "Clase de Cálculo",
  descripcion: "Repasar integrales",
  fecha: "2026-10-20",
  horaInicio: "08:00",
  horaFin: "10:00",
  categoriaId: "universidad",
  categoria: "Universidad",
  ubicacion: "Aula 204",
}
```

### Validación existente

| Campo | Comportamiento de `normalizeEvent()` |
| --- | --- |
| `id` | Debe ser `string`. Hoy no rechaza cadena vacía; los nuevos eventos deben generar un ID único, estable y no vacío. |
| `titulo` | Debe ser `string`; se recorta y se rechaza si queda vacío. |
| `fecha` | Obligatoria; `dateUtils.parseDateKey()` exige `YYYY-MM-DD` y una fecha real. |
| `descripcion` | Opcional; usa `""` si no es texto. No se recorta actualmente. |
| `horaInicio` | Opcional en lectura; usa `""` si no es texto. `event-storage.js` no valida formato. |
| `horaFin` | Opcional en lectura; usa `""` si no es texto. `event-storage.js` no valida formato. |
| `categoriaId` | Opcional por compatibilidad; usa `""` si no es texto. |
| `categoria` | Usa `"Otros"` si no es texto. Mantiene compatibilidad con datos antiguos. |
| `ubicacion` | Opcional; se recorta o usa `""`. |

### Fechas y horas

- Persistir fechas locales `YYYY-MM-DD`, no fechas ISO UTC.
- Usar `dateUtils.parseDateKey()` y `dateUtils.getDateKey()`.
- `timelineUtils.parseTime()` valida `HH:mm` entre `00:00` y `23:59`; admite `24:00` solo como final cuando se solicita.
- `getEventInterval()` exige inicio válido. Si el final falta o no es posterior, aplica visualmente una hora sin modificar datos.

El formulario futuro debe validar horas antes de guardar; no debe usar esa duración visual como validación.

### Relación con categorías

Los eventos nuevos deben guardar `categoriaId` como relación estable y `categoria` como nombre compatible. No usar el nombre como identificador porque puede cambiar en Configuración.

## 7. Contrato de categorías

Formato real en `src/js/category-storage.js`:

```js
{
  id: "universidad",
  name: "Universidad",
  color: "#2563EB",
  aliases: [],
}
```

- Se leen con `categoryStorage.readCategories()` desde `calendario_categorias`.
- Si los datos faltan o son inválidos, se generan cinco categorías desde `--category-*`.
- `id` permanece estable al editar.
- `aliases` conserva nombres anteriores.
- `findCategoryForEvent(event, categories)` busca por `categoriaId`, luego por nombre/alias y finalmente intenta `otros`.
- `applyCategoryColor()` aplica color y, opcionalmente, un fondo derivado.
- `categoryHasEvents()` relaciona por ID, nombre o alias.

Mis Eventos debe recibir `state.categories` y resolver cada categoría con `findCategoryForEvent()`. No debe mantener una lista fija ni una copia independiente.

## 8. Contrato de almacenamiento

| Clave | Propietario | Contenido |
| --- | --- | --- |
| `calendario_eventos` | `eventStorage` | Arreglo JSON de eventos. |
| `calendario_categorias` | `categoryStorage` | Arreglo JSON de categorías. |
| `calendario_configuracion` | `settingsStorage` | Preferencias. |

### API actual de eventos

`window.CalendarApp.eventStorage` está congelado y expone únicamente:

- `STORAGE_KEY`;
- `readEvents()`;
- `sortEventsChronologically(events)`.

`readEvents()` controla ausencia, JSON inválido, valores no-arreglo y errores de acceso; devuelve `[]` y descarta registros inválidos. `sortEventsChronologically()` devuelve una copia ordenada por fecha y hora.

### Operaciones pendientes

No existen funciones públicas para escribir, crear, actualizar o eliminar eventos. Deben incorporarse a `event-storage.js` antes de habilitar CRUD, seguir el patrón defensivo de `category-storage.js`, no mutar el arreglo recibido y devolver resultados explícitos como `{ ok, events?, error? }`.

Los nombres son una decisión compartida. Si se adoptan `writeEvents`, `createEvent`, `updateEvent` y `deleteEvent`, deben documentarse y publicarse en `eventStorage`; no deben duplicarse dentro de la vista.

No existe versión de esquema ni migración. Un cambio de formato exige una migración explícita.

## 9. Comunicación entre módulos

```text
acción del usuario
    → callback entregado por script.js
    → validación/persistencia en eventStorage
    → reemplazo de state.events
    → render()
    → Calendario + Mis Eventos + panel derecho reciben el mismo arreglo
```

### Crear y editar

- La vista entrega datos a un callback de `script.js`.
- Buscar eventos por `id`, nunca por índice o título.
- Editar conserva el ID y produce un arreglo nuevo.
- Persistir antes de reemplazar `state.events`.
- Ejecutar un solo `render()` después del éxito.

### Eliminar

- Abrir `ConfirmationDialog` y diferir la mutación hasta confirmar.
- Eliminar por ID en el coordinador.
- Persistir, reemplazar `state.events` y renderizar.
- No usar `window.confirm()` ni duplicar el modal.

### Categorías

- Todas las vistas reciben `state.categories`.
- Eventos nuevos guardan ID y nombre de categoría.
- La presentación usa `findCategoryForEvent()`.
- Un cambio de nombre no exige reescribir eventos porque el ID es estable y existen alias.

### Límites actuales

Los eventos se leen una vez al cargar. No existe listener `storage`, actualización entre pestañas ni sincronización en segundo plano. No ampliar ese alcance sin acuerdo.

## 10. Componentes compartidos

| Componente | Uso |
| --- | --- |
| `ConfirmationDialog` | Confirmar eliminación de eventos. Ya se instancia en `script.js`. |
| `dateUtils` | Validar y formatear fechas locales. |
| `timelineUtils` | Validar horas e intervalos. |
| `eventStorage` | Leer y ordenar; las mutaciones siguen pendientes. |
| `categoryStorage` | Leer, resolver y colorear categorías. |
| `.primary-button` | Acción principal. |
| `.secondary-button` | Cancelar o limpiar filtros. |
| `.settings-icon-button` | Referencia de acción compacta; coordinar un nombre neutral antes de reutilizarla fuera de Configuración. |

### Confirmación reutilizable

```js
confirmationDialog.open({
  title: "Eliminar evento",
  message: `¿Estás seguro de que deseas eliminar el evento "${event.titulo}"?`,
  description: "Esta acción no se puede deshacer.",
  confirmLabel: "Eliminar",
  trigger: deleteButton,
  onConfirm: () => deleteEvent(event.id),
});
```

`onConfirm` puede ser síncrono o promesa. Si devuelve `{ ok: false, error }`, el modal permanece abierto. El componente gestiona Escape, cancelación, foco contenido, restauración del foco, bloqueo de desplazamiento y movimiento reducido.

### Dependencias aún inexistentes

- formulario de eventos;
- tabla/paginación compartida;
- escritura de eventos;
- callbacks CRUD en `script.js`;
- clase `MyEventsView`.

## 11. Normas de CSS

Variables oficiales de `src/styles/variables.css`:

```css
--color-primary;
--color-primary-light;
--color-background;
--color-surface;
--color-text;
--color-text-secondary;
--color-border;
--color-danger;
--color-success;
--category-university;
--category-university-bg;
--category-work;
--category-work-bg;
--category-personal;
--category-personal-bg;
--category-health;
--category-health-bg;
--category-other;
--category-other-bg;
```

- No repetir hexadecimales si existe token.
- Usar `--color-primary` para acciones principales y `--color-danger` para eliminar.
- Resolver colores dinámicos mediante `categoryStorage`.
- No volver a importar `variables.css`; `main.css` ya lo hace.
- Encapsular estilos con prefijo `my-events-`.
- No crear reglas globales para `table`, `tr`, `td`, `input`, `select` o `button`.
- Reutilizar `.primary-button` y `.secondary-button` cuando corresponda.
- Acciones de fila: `type="button"`, nombre accesible y foco visible.
- La categoría debe tener texto; el color no puede ser el único indicador.

No existe un estilo de tabla compartido. La nueva tabla debe usar `<th scope="col">`, un contenedor con `overflow-x: auto`, acciones por teclado y un estado vacío sin filas ficticias. Debe adaptarse a los quiebres existentes `72rem`, `48rem` y `30rem`, sin cambiar `.app-shell` ni el ancho del sidebar.

## 12. Integración con navegación

### Estado actual

- Mis eventos es un `<button disabled>` sin `data-module-target`.
- Los destinos disponibles usan `calendar` y `settings`.
- `changeModule()` solo acepta esos dos valores.
- Los hashes son `#calendario` y `#configuracion`.
- `render()` controla `#calendario`, `#configuracion` y `.upcoming-panel`.

### Integración mínima

1. Convertir el control en navegable.
2. Acordar un destino, por ejemplo `data-module-target="events"`, y un hash como `#mis-eventos`.
3. Añadir un `<main>` independiente para el contenido central.
4. Registrar el elemento en `script.js`.
5. Ampliar `changeModule()` y la inicialización desde `location.hash`.
6. Alternar `hidden` y `aria-current` desde el coordinador.
7. Llamar a `myEventsView.render({ events: state.events, categories: state.categories })` cuando corresponda.

Los identificadores anteriores son propuestas, no APIs existentes. El sidebar y el panel derecho deben reutilizarse. La visibilidad del panel derecho en Mis Eventos se acuerda en `script.js`; nunca se resuelve creando un segundo panel.

## 13. Reglas de Git

No se realizaron operaciones Git durante esta documentación.

```bash
git switch main
git pull --ff-only
git switch -c feature/mis-eventos
```

- Coordinar antes de editar `index.html`, `script.js` o `event-storage.js`.
- Separar commits por almacenamiento, vista, estilos, integración y documentación.
- No incluir formateos masivos ni cambios ajenos.
- Actualizarse con `git fetch origin` y `git rebase origin/main` si la rama es individual; si es compartida, acordar merge para no reescribir trabajo ajeno.
- Resolver conflictos de forma localizada; no reemplazar completos archivos compartidos.

El PR debe explicar alcance, contrato final de escritura, pruebas, archivos compartidos, estados vacío/con datos, responsive y sincronización con las otras vistas. Debe confirmar que no hay dependencias ni datos ficticios.

## 14. Pruebas de aceptación

### Datos

- [ ] Lee eventos reales desde `calendario_eventos`.
- [ ] Presenta estado vacío sin registros.
- [ ] No añade datos de demostración.
- [ ] Persiste al recargar.

### Búsqueda, filtros y orden

- [ ] Busca por título sin mutar `state.events`.
- [ ] Define si incluye descripción o ubicación.
- [ ] Filtra categoría por ID y obtiene opciones de `state.categories`.
- [ ] Limpiar filtros restaura resultados y primera página.
- [ ] Ordena una copia, reutilizando `sortEventsChronologically()` cuando aplique.
- [ ] Cambiar filtros u orden corrige páginas fuera de rango.

### Paginación

- [ ] El total usa el resultado filtrado.
- [ ] El tamaño de página recalcula páginas.
- [ ] Anterior/Siguiente se deshabilitan en extremos.
- [ ] No hay páginas ficticias en estado vacío.

### Categorías

- [ ] Cada fila usa `findCategoryForEvent()`.
- [ ] Nombre y color cambian después de Configuración.
- [ ] Datos heredados sin `categoriaId` funcionan por nombre/alias.
- [ ] La categoría muestra texto además de color.

### CRUD

- [ ] Permanece deshabilitado hasta existir persistencia centralizada.
- [ ] Crea IDs únicos y no vacíos.
- [ ] Valida fecha y horas.
- [ ] Editar conserva ID.
- [ ] Eliminar usa `ConfirmationDialog`.
- [ ] Cancelar, X, fondo y Escape no eliminan.
- [ ] Un error conserva datos anteriores y se informa.

### Integración y regresión

- [ ] Crear, editar y eliminar actualizan Mis Eventos, Mes/Semana/Día y panel derecho con un `render()`.
- [ ] No existen arreglos duplicados como fuentes de verdad.
- [ ] Navegación actualiza hash y `aria-current`.
- [ ] La tabla es semántica, accesible y responsive.
- [ ] Sidebar y panel derecho no cambian visualmente.
- [ ] Calendario y Configuración conservan su comportamiento.
- [ ] No hay errores nuevos en consola.

## 15. Dependencias y riesgos

| Riesgo | Mitigación |
| --- | --- |
| No existe escritura de eventos. | Definirla en `event-storage.js` antes del CRUD. |
| La lectura no valida horas. | Validar con `timelineUtils.parseTime()` y exigir final posterior. |
| El normalizador acepta ID vacío. | Generar siempre ID no vacío; endurecer contrato solo coordinadamente. |
| `script.js` es coordinador único. | Añadir callbacks pequeños y evitar reescrituras. |
| Navegación solo conoce dos módulos. | Ampliarla de forma coordinada. |
| Panel derecho se oculta fuera de Calendario. | Acordar su visibilidad sin duplicarlo. |
| Eventos heredados sin `categoriaId`. | Conservar `categoria` y usar resolución oficial. |
| No hay sincronización entre pestañas. | Mantener fuera de alcance salvo acuerdo. |
| No existe formulario. | Tratarlo como dependencia separada/coordinada. |
| No hay suite automatizada. | Usar checklist manual y comprobación sintáctica sin instalar herramientas. |

## 16. Pasos recomendados para comenzar el desarrollo

1. Crear la rama desde una base actualizada.
2. Acordar identificador, hash y visibilidad del panel derecho.
3. Definir el contrato de escritura, resultados, validaciones e IDs.
4. Implementar y comprobar persistencia antes de habilitar botones.
5. Crear primero una vista de solo lectura con `state.events` y `state.categories`.
6. Añadir estado vacío, búsqueda, filtros y orden como datos derivados.
7. Añadir paginación sobre resultados ya filtrados y ordenados.
8. Integrar `<main>` y navegación con cambios mínimos.
9. Conectar crear/editar solo con formulario y almacenamiento validados.
10. Conectar eliminar mediante `ConfirmationDialog`.
11. Ejecutar el checklist, probar recarga y revisar consola.
12. Actualizar `README.md`, JSDoc y la estructura local de `AGENTS.md`.
13. Sincronizar la rama, resolver conflictos localmente y preparar el PR.

Regla central: **las vistas consumen estado; el coordinador lo muta; el almacenamiento persiste; un único `render()` sincroniza toda la aplicación**.
