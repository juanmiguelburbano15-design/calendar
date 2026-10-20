/**
 * Acceso defensivo a los eventos persistidos en `localStorage`.
 *
 * Este módulo solo se encarga de leer, normalizar y ordenar. Las operaciones
 * de escritura se añadirán cuando se implemente la gestión de eventos.
 */
(function initializeEventStorage(global) {
  const STORAGE_KEY = "calendario_eventos";

  /**
   * @typedef {Object} CalendarEvent
   * @property {string} id Identificador estable del evento.
   * @property {string} titulo Título visible.
   * @property {string} descripcion Descripción opcional.
   * @property {string} fecha Fecha local con formato `YYYY-MM-DD`.
   * @property {string} horaInicio Hora inicial con formato `HH:mm`.
   * @property {string} horaFin Hora final con formato `HH:mm`.
   * @property {string} categoria Categoría utilizada por el sistema visual.
   * @property {string} ubicacion Ubicación opcional.
   */

  /** @param {unknown} value @returns {boolean} Indica si el valor es texto. */
  function isText(value) {
    return typeof value === "string";
  }

  /**
   * Valida un registro almacenado y completa sus campos opcionales.
   *
   * @param {unknown} value Registro leído desde el almacenamiento.
   * @returns {CalendarEvent|null} Evento normalizado o `null` si es inválido.
   */
  function normalizeEvent(value) {
    const { dateUtils } = global.CalendarApp;

    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }

    if (!isText(value.id) || !isText(value.titulo) || !dateUtils.parseDateKey(value.fecha)) {
      return null;
    }

    const title = value.titulo.trim();
    if (!title) {
      return null;
    }

    return {
      id: value.id,
      titulo: title,
      descripcion: isText(value.descripcion) ? value.descripcion : "",
      fecha: value.fecha,
      horaInicio: isText(value.horaInicio) ? value.horaInicio : "",
      horaFin: isText(value.horaFin) ? value.horaFin : "",
      categoria: isText(value.categoria) ? value.categoria : "Otros",
      ubicacion: isText(value.ubicacion) ? value.ubicacion.trim() : "",
    };
  }

  /**
   * Lee todos los eventos válidos sin propagar errores de almacenamiento o JSON.
   *
   * @returns {CalendarEvent[]} Copia normalizada de los eventos persistidos.
   */
  function readEvents() {
    try {
      const storedValue = global.localStorage.getItem(STORAGE_KEY);
      if (!storedValue) {
        return [];
      }

      const parsedValue = JSON.parse(storedValue);
      if (!Array.isArray(parsedValue)) {
        return [];
      }

      return parsedValue.map(normalizeEvent).filter(Boolean);
    } catch {
      return [];
    }
  }

  /**
   * Ordena eventos por fecha y hora sin modificar el arreglo recibido.
   *
   * @param {CalendarEvent[]} events Eventos que se desean ordenar.
   * @returns {CalendarEvent[]} Nueva colección ordenada cronológicamente.
   */
  function sortEventsChronologically(events) {
    return [...events].sort((firstEvent, secondEvent) => {
      const firstDateTime = `${firstEvent.fecha}T${firstEvent.horaInicio || "00:00"}`;
      const secondDateTime = `${secondEvent.fecha}T${secondEvent.horaInicio || "00:00"}`;

      return firstDateTime.localeCompare(secondDateTime);
    });
  }

  global.CalendarApp = {
    ...global.CalendarApp,
    eventStorage: Object.freeze({
      STORAGE_KEY,
      readEvents,
      sortEventsChronologically,
    }),
  };
}(window));
