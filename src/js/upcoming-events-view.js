/**
 * Lista de eventos del periodo activo y su estado vacío.
 */
(function initializeUpcomingEventsView(global) {
  const PERIOD_COPY = Object.freeze({
    day: Object.freeze({
      description: "Los eventos del día aparecerán aquí.",
      title: "Eventos del día",
    }),
    month: Object.freeze({
      description: "Los eventos del mes aparecerán aquí.",
      title: "Eventos del mes",
    }),
    week: Object.freeze({
      description: "Los eventos de la semana aparecerán aquí.",
      title: "Eventos de la semana",
    }),
  });

  /** Renderiza los eventos del periodo activo en orden cronológico. */
  class UpcomingEventsView {
    /**
     * @param {Object} options Dependencias de la vista.
     * @param {HTMLElement} options.countElement Contador de eventos del periodo.
     * @param {HTMLElement} options.container Contenedor del listado.
     * @param {HTMLElement} options.titleElement Encabezado de la sección.
     */
    constructor({ countElement, container, titleElement }) {
      this.countElement = countElement;
      this.container = container;
      this.titleElement = titleElement;
    }

    /**
     * Filtra los eventos del periodo activo y reconstruye el contenido del panel.
     *
     * @param {Object} state Estado actual del calendario.
     * @param {"month"|"week"|"day"} state.activeView Vista activa.
     * @param {CalendarEvent[]} state.events Eventos disponibles.
     * @param {Date} state.selectedDate Fecha seleccionada.
     * @param {Date} state.visibleMonth Mes visible en la vista mensual.
     * @returns {void}
     */
    render({ activeView, events, selectedDate, visibleMonth }) {
      const { eventStorage } = global.CalendarApp;
      const periodEvents = eventStorage.sortEventsChronologically(
        this.filterEvents({ activeView, events, selectedDate, visibleMonth }),
      );
      const periodCopy = PERIOD_COPY[activeView];

      this.titleElement.textContent = periodCopy.title;
      this.countElement.textContent = periodEvents.length === 1
        ? "1 evento"
        : `${periodEvents.length} eventos`;
      this.container.replaceChildren();

      if (periodEvents.length === 0) {
        this.container.append(this.createEmptyState(periodCopy.description));
        return;
      }

      const list = document.createElement("ul");
      list.className = "upcoming-list";

      periodEvents.forEach((event) => {
        list.append(this.createEventItem(event));
      });

      this.container.append(list);
    }

    /**
     * Selecciona eventos del mes visible, la semana o el día seleccionado.
     *
     * @param {Object} options Criterios del periodo.
     * @param {"month"|"week"|"day"} options.activeView Vista activa.
     * @param {CalendarEvent[]} options.events Eventos disponibles.
     * @param {Date} options.selectedDate Fecha seleccionada.
     * @param {Date} options.visibleMonth Mes visible.
     * @returns {CalendarEvent[]} Eventos pertenecientes al periodo.
     */
    filterEvents({ activeView, events, selectedDate, visibleMonth }) {
      const { dateUtils } = global.CalendarApp;

      if (activeView === "month") {
        return events.filter((event) => {
          const eventDate = dateUtils.parseDateKey(event.fecha);
          return eventDate && dateUtils.isSameMonth(eventDate, visibleMonth);
        });
      }

      if (activeView === "week") {
        const weekKeys = new Set(
          dateUtils.getWeekDates(selectedDate).map(dateUtils.getDateKey),
        );
        return events.filter((event) => weekKeys.has(event.fecha));
      }

      const selectedKey = dateUtils.getDateKey(selectedDate);
      return events.filter((event) => event.fecha === selectedKey);
    }

    /**
     * @param {string} description Texto contextual para el periodo activo.
     * @returns {HTMLDivElement} Mensaje mostrado cuando el periodo no tiene eventos.
     */
    createEmptyState(description) {
      const emptyState = document.createElement("div");
      const icon = document.createElement("span");
      const title = document.createElement("p");
      const descriptionElement = document.createElement("span");

      emptyState.className = "empty-state";
      icon.className = "empty-state__icon";
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/></svg>';
      title.textContent = "No hay eventos para este período";
      descriptionElement.textContent = description;

      emptyState.append(icon, title, descriptionElement);
      return emptyState;
    }

    /**
     * @param {CalendarEvent} event Evento que se desea presentar.
     * @returns {HTMLLIElement} Elemento listo para agregar al listado.
     */
    createEventItem(event) {
      const { dateUtils, normalizeCategory } = global.CalendarApp;
      const item = document.createElement("li");
      const dot = document.createElement("span");
      const content = document.createElement("div");
      const title = document.createElement("h3");
      const metadata = document.createElement("p");
      const chevron = document.createElement("span");
      const eventDate = dateUtils.parseDateKey(event.fecha);
      const timeLabel = event.horaInicio ? ` · ${event.horaInicio}` : "";
      const locationLabel = event.ubicacion ? ` · ${event.ubicacion}` : "";
      const category = normalizeCategory(event.categoria);

      item.className = "upcoming-event";
      dot.className = `upcoming-event__dot upcoming-event__dot--${category}`;
      dot.setAttribute("aria-hidden", "true");
      title.textContent = event.titulo;
      metadata.textContent = `${dateUtils.formatUpcomingDate(eventDate)}${timeLabel}${locationLabel}`;
      chevron.className = "upcoming-event__chevron";
      chevron.setAttribute("aria-hidden", "true");
      chevron.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="m9 18 6-6-6-6"/></svg>';
      content.className = "upcoming-event__content";
      content.append(title, metadata);
      item.append(dot, content, chevron);

      return item;
    }
  }

  global.CalendarApp = {
    ...global.CalendarApp,
    UpcomingEventsView,
  };
}(window));
