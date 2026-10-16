(function initializeEventStorage(global) {
  const STORAGE_KEY = "calendario_eventos";

  function isText(value) {
    return typeof value === "string";
  }

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
