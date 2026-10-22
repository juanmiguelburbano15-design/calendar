/**
 * Vista mensual del calendario.
 */
(function initializeCalendarView(global) {
  const CATEGORY_CLASS = Object.freeze({
    universidad: "university",
    trabajo: "work",
    personal: "personal",
    salud: "health",
    otros: "other",
  });

  /**
   * Convierte el nombre de una categoría en el sufijo de clase CSS permitido.
   * Los valores desconocidos se presentan como `Otros`.
   *
   * @param {unknown} value Categoría almacenada en el evento.
   * @returns {"university"|"work"|"personal"|"health"|"other"} Sufijo CSS.
   */
  function normalizeCategory(value) {
    const normalizedValue = String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    return CATEGORY_CLASS[normalizedValue] || CATEGORY_CLASS.otros;
  }

  /** Renderiza una cuadrícula mensual interactiva. */
  class CalendarView {
    /**
     * @param {Object} options Dependencias de la vista.
     * @param {HTMLElement} options.titleElement Elemento que muestra el periodo.
     * @param {HTMLElement} options.daysElement Contenedor de las celdas mensuales.
     * @param {HTMLElement} options.weekdaysElement Encabezado de días de la semana.
     * @param {(date: Date) => void} options.onSelectDate Acción al elegir una fecha.
     */
    constructor({ titleElement, daysElement, weekdaysElement, onSelectDate }) {
      this.titleElement = titleElement;
      this.daysElement = daysElement;
      this.weekdaysElement = weekdaysElement;
      this.onSelectDate = onSelectDate;
    }

    /**
     * Reconstruye la cuadrícula a partir del estado actual.
     *
     * @param {Object} state Fragmento de estado necesario por la vista.
     * @param {Date} state.visibleMonth Mes que se debe mostrar.
     * @param {Date} state.selectedDate Fecha seleccionada.
     * @param {CalendarEvent[]} state.events Eventos disponibles.
     * @param {CalendarCategory[]} state.categories Categorías compartidas.
     * @param {{firstDayOfWeek: "monday"|"sunday"}} state.settings Preferencias.
     * @returns {void}
     */
    render({ visibleMonth, selectedDate, events, categories, settings }) {
      const { dateUtils } = global.CalendarApp;
      const today = new Date();
      const dates = dateUtils.getMonthGridDates(visibleMonth, settings.firstDayOfWeek);
      const eventsByDate = this.groupEventsByDate(events);

      this.titleElement.textContent = dateUtils.formatMonthTitle(visibleMonth);
      this.weekdaysElement.replaceChildren(...dateUtils
        .getWeekdayLabels(settings.firstDayOfWeek)
        .map((weekday) => {
          const label = document.createElement("span");
          label.textContent = weekday;
          return label;
        }));
      this.daysElement.replaceChildren();

      dates.forEach((date) => {
        const dateKey = dateUtils.getDateKey(date);
        const dayEvents = eventsByDate.get(dateKey) || [];
        const dayButton = this.createDayButton({
          date,
          dayEvents,
          categories,
          isCurrentMonth: dateUtils.isSameMonth(date, visibleMonth),
          isSelected: dateUtils.isSameDay(date, selectedDate),
          isToday: dateUtils.isSameDay(date, today),
        });

        this.daysElement.append(dayButton);
      });
    }

    /**
     * @param {CalendarEvent[]} events Eventos que se desean agrupar.
     * @returns {Map<string, CalendarEvent[]>} Eventos indexados por `YYYY-MM-DD`.
     */
    groupEventsByDate(events) {
      return events.reduce((eventsByDate, event) => {
        const eventsForDay = eventsByDate.get(event.fecha) || [];
        eventsForDay.push(event);
        eventsByDate.set(event.fecha, eventsForDay);
        return eventsByDate;
      }, new Map());
    }

    /**
     * Crea una celda accesible de la cuadrícula mensual.
     *
     * @param {Object} options Datos visuales del día.
     * @param {Date} options.date Fecha representada.
     * @param {CalendarEvent[]} options.dayEvents Eventos de la fecha.
     * @param {CalendarCategory[]} options.categories Categorías compartidas.
     * @param {boolean} options.isCurrentMonth Indica si pertenece al mes visible.
     * @param {boolean} options.isSelected Indica si es la fecha seleccionada.
     * @param {boolean} options.isToday Indica si es el día actual.
     * @returns {HTMLButtonElement} Celda mensual lista para insertar.
     */
    createDayButton({ date, dayEvents, categories, isCurrentMonth, isSelected, isToday }) {
      const { categoryStorage, dateUtils } = global.CalendarApp;
      const button = document.createElement("button");
      const number = document.createElement("span");
      const eventsContainer = document.createElement("span");
      const eventDescription = dayEvents.length === 1 ? "1 evento" : `${dayEvents.length} eventos`;

      button.type = "button";
      button.className = "calendar-day";
      button.dataset.date = dateUtils.getDateKey(date);
      button.setAttribute("aria-pressed", String(isSelected));
      button.setAttribute(
        "aria-label",
        `${dateUtils.formatLongDate(date)}${dayEvents.length ? `, ${eventDescription}` : ""}`,
      );

      if (!isCurrentMonth) {
        button.classList.add("calendar-day--outside");
      }
      if (isSelected) {
        button.classList.add("calendar-day--selected");
      }
      if (isToday) {
        button.classList.add("calendar-day--today");
        button.setAttribute("aria-current", "date");
      }

      number.className = "calendar-day__number";
      number.textContent = String(date.getDate());
      eventsContainer.className = "calendar-day__events";
      eventsContainer.setAttribute("aria-hidden", "true");

      dayEvents.slice(0, 2).forEach((event) => {
        const eventChip = document.createElement("span");
        const category = categoryStorage.findCategoryForEvent(event, categories);
        eventChip.className = "event-chip";
        categoryStorage.applyCategoryColor(eventChip, category);
        eventChip.textContent = event.titulo;
        eventChip.title = event.titulo;
        eventsContainer.append(eventChip);
      });

      if (dayEvents.length > 2) {
        const eventCount = document.createElement("span");
        eventCount.className = "event-count";
        eventCount.textContent = `+${dayEvents.length - 2} más`;
        eventsContainer.append(eventCount);
      }

      button.append(number, eventsContainer);
      button.addEventListener("click", () => this.onSelectDate(date));

      return button;
    }
  }

  global.CalendarApp = {
    ...global.CalendarApp,
    CalendarView,
    normalizeCategory,
  };
}(window));
