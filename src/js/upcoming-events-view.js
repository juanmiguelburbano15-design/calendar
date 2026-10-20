/**
 * Panel lateral de próximos eventos y su estado vacío.
 */
(function initializeUpcomingEventsView(global) {
  /** Renderiza los eventos futuros en orden cronológico. */
  class UpcomingEventsView {
    /** @param {HTMLElement} container Contenedor del listado. */
    constructor(container) {
      this.container = container;
    }

    /**
     * Filtra eventos anteriores a hoy y reconstruye el contenido del panel.
     *
     * @param {CalendarEvent[]} events Eventos disponibles.
     * @param {Date} today Fecha actual normalizada.
     * @returns {void}
     */
    render(events, today) {
      const { dateUtils, eventStorage } = global.CalendarApp;
      const todayKey = dateUtils.getDateKey(today);
      const upcomingEvents = eventStorage
        .sortEventsChronologically(events)
        .filter((event) => event.fecha >= todayKey);

      this.container.replaceChildren();

      if (upcomingEvents.length === 0) {
        this.container.append(this.createEmptyState());
        return;
      }

      const list = document.createElement("ul");
      list.className = "upcoming-list";

      upcomingEvents.forEach((event) => {
        list.append(this.createEventItem(event));
      });

      this.container.append(list);
    }

    /** @returns {HTMLDivElement} Mensaje mostrado cuando no hay eventos próximos. */
    createEmptyState() {
      const emptyState = document.createElement("div");
      const icon = document.createElement("span");
      const title = document.createElement("p");
      const description = document.createElement("span");

      emptyState.className = "empty-state";
      icon.className = "empty-state__icon";
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/></svg>';
      title.textContent = "No tienes eventos próximos";
      description.textContent = "Los eventos futuros aparecerán aquí cuando estén disponibles.";

      emptyState.append(icon, title, description);
      return emptyState;
    }

    /**
     * @param {CalendarEvent} event Evento que se desea presentar.
     * @returns {HTMLLIElement} Elemento listo para agregar al listado.
     */
    createEventItem(event) {
      const { dateUtils, normalizeCategory } = global.CalendarApp;
      const item = document.createElement("li");
      const title = document.createElement("h3");
      const metadata = document.createElement("p");
      const eventDate = dateUtils.parseDateKey(event.fecha);
      const timeLabel = event.horaInicio ? ` · ${event.horaInicio}` : "";

      item.className = `upcoming-event upcoming-event--${normalizeCategory(event.categoria)}`;
      title.textContent = event.titulo;
      metadata.textContent = `${dateUtils.formatUpcomingDate(eventDate)}${timeLabel}`;
      item.append(title, metadata);

      return item;
    }
  }

  global.CalendarApp = {
    ...global.CalendarApp,
    UpcomingEventsView,
  };
}(window));
