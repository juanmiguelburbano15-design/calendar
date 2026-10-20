/**
 * Vista horaria compartida por los modos Semana y Día.
 */
(function initializeTimeGridView(global) {
  /** Renderiza eventos sobre una cuadrícula vertical de horas. */
  class TimeGridView {
    /**
     * @param {Object} options Dependencias de la vista.
     * @param {HTMLElement} options.container Contenedor reemplazado en cada render.
     * @param {HTMLElement} options.titleElement Título del periodo visible.
     */
    constructor({ container, titleElement }) {
      this.container = container;
      this.titleElement = titleElement;
    }

    /**
     * Renderiza una o siete columnas según el modo solicitado.
     *
     * @param {Object} state Estado necesario por la vista.
     * @param {"week"|"day"} state.mode Modo de la cuadrícula.
     * @param {Date} state.selectedDate Fecha de referencia.
     * @param {CalendarEvent[]} state.events Eventos disponibles.
     * @returns {void}
     */
    render({ mode, selectedDate, events }) {
      const { dateUtils, timelineUtils } = global.CalendarApp;
      const dates = mode === "week" ? dateUtils.getWeekDates(selectedDate) : [selectedDate];
      const dateKeys = new Set(dates.map(dateUtils.getDateKey));
      const visibleEvents = events.filter((event) => dateKeys.has(event.fecha));
      const range = timelineUtils.getVisibleRange(visibleEvents);
      const section = document.createElement("section");
      const header = this.createHeader(dates, selectedDate);
      const scrollArea = document.createElement("div");
      const body = this.createBody(dates, visibleEvents, range);

      this.titleElement.textContent = mode === "week"
        ? dateUtils.formatWeekTitle(selectedDate)
        : dateUtils.formatDayTitle(selectedDate);

      section.className = `time-grid-view time-grid-view--${mode}`;
      section.style.setProperty("--day-count", String(dates.length));
      scrollArea.className = "time-grid-scroll";
      scrollArea.tabIndex = 0;
      scrollArea.setAttribute(
        "aria-label",
        mode === "week" ? "Agenda semanal desplazable" : "Agenda diaria desplazable",
      );
      scrollArea.append(header, body);
      section.append(scrollArea);
      this.container.replaceChildren(section);
    }

    /**
     * @param {Date[]} dates Fechas representadas por las columnas.
     * @param {Date} selectedDate Fecha seleccionada.
     * @returns {HTMLDivElement} Encabezado de días.
     */
    createHeader(dates, selectedDate) {
      const { dateUtils } = global.CalendarApp;
      const header = document.createElement("div");
      const spacer = document.createElement("span");
      const today = new Date();

      header.className = "time-grid-header";
      spacer.className = "time-grid-header__spacer";
      spacer.setAttribute("aria-hidden", "true");
      header.append(spacer);

      dates.forEach((date) => {
        const day = document.createElement("div");
        const weekday = document.createElement("strong");
        const dayAndMonth = document.createElement("span");

        day.className = "time-grid-header__day";
        if (dateUtils.isSameDay(date, selectedDate)) {
          day.classList.add("time-grid-header__day--selected");
        }
        if (dateUtils.isSameDay(date, today)) {
          day.classList.add("time-grid-header__day--today");
          day.setAttribute("aria-current", "date");
        }

        weekday.textContent = dateUtils.formatWeekday(date);
        dayAndMonth.textContent = dateUtils.formatDayAndMonth(date);
        day.append(weekday, dayAndMonth);
        header.append(day);
      });

      return header;
    }

    /**
     * Construye las etiquetas horarias, columnas, eventos y marcador actual.
     *
     * @param {Date[]} dates Fechas visibles.
     * @param {CalendarEvent[]} events Eventos ya filtrados al periodo.
     * @param {{startMinutes: number, endMinutes: number}} range Intervalo horario.
     * @returns {HTMLDivElement} Cuerpo completo de la cuadrícula.
     */
    createBody(dates, events, range) {
      const { dateUtils, timelineUtils } = global.CalendarApp;
      const body = document.createElement("div");
      const timeLabels = document.createElement("div");
      const dayColumns = document.createElement("div");
      const hourMarks = timelineUtils.getHourMarks(range);
      const bodyHeight = ((range.endMinutes - range.startMinutes) / 60) * timelineUtils.HOUR_HEIGHT;
      const today = new Date();

      body.className = "time-grid-body";
      body.style.height = `${bodyHeight}px`;
      timeLabels.className = "time-grid-times";
      dayColumns.className = "time-grid-days";

      hourMarks.forEach((minutes, index) => {
        const label = document.createElement("span");
        label.className = "time-grid-time";
        label.textContent = timelineUtils.formatMinutes(minutes);
        label.style.top = `${index * timelineUtils.HOUR_HEIGHT}px`;
        timeLabels.append(label);
      });

      dates.forEach((date) => {
        const dateKey = dateUtils.getDateKey(date);
        const column = document.createElement("div");
        const dayEvents = events.filter((event) => event.fecha === dateKey);

        column.className = "time-grid-day";
        column.dataset.date = dateKey;
        if (dateUtils.isSameDay(date, today)) {
          column.classList.add("time-grid-day--today");
        }

        hourMarks.forEach((_, index) => {
          const line = document.createElement("span");
          line.className = "time-grid-hour-line";
          line.style.top = `${index * timelineUtils.HOUR_HEIGHT}px`;
          line.setAttribute("aria-hidden", "true");
          column.append(line);
        });

        timelineUtils.layoutOverlappingEvents(dayEvents).forEach((interval) => {
          column.append(this.createEventBlock(interval, range));
        });

        if (dateUtils.isSameDay(date, today)) {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();

          if (currentMinutes >= range.startMinutes && currentMinutes <= range.endMinutes) {
            column.append(this.createCurrentTimeMarker(currentMinutes, range));
          }
        }

        dayColumns.append(column);
      });

      body.append(timeLabels, dayColumns);
      return body;
    }

    /**
     * @param {Object} interval Evento con intervalo y carril calculados.
     * @param {{startMinutes: number, endMinutes: number}} range Intervalo horario.
     * @returns {HTMLElement} Bloque visual posicionado del evento.
     */
    createEventBlock(interval, range) {
      const { normalizeCategory, timelineUtils } = global.CalendarApp;
      const metrics = timelineUtils.getBlockMetrics(interval, range);
      const eventBlock = document.createElement("article");
      const time = document.createElement("span");
      const title = document.createElement("strong");

      eventBlock.className = `timeline-event timeline-event--${normalizeCategory(interval.event.categoria)}`;
      eventBlock.style.top = `${metrics.top}px`;
      eventBlock.style.height = `${metrics.height}px`;
      eventBlock.style.left = `calc(${metrics.leftPercentage}% + 0.2rem)`;
      eventBlock.style.width = `calc(${metrics.widthPercentage}% - 0.4rem)`;
      eventBlock.setAttribute(
        "aria-label",
        `${interval.event.titulo}, ${interval.event.horaInicio} a ${interval.event.horaFin || timelineUtils.formatMinutes(interval.endMinutes)}`,
      );

      time.className = "timeline-event__time";
      time.textContent = `${interval.event.horaInicio} – ${interval.event.horaFin || timelineUtils.formatMinutes(interval.endMinutes)}`;
      title.className = "timeline-event__title";
      title.textContent = interval.event.titulo;
      eventBlock.append(time, title);

      if (interval.event.ubicacion) {
        const location = document.createElement("span");
        location.className = "timeline-event__location";
        location.textContent = interval.event.ubicacion;
        eventBlock.append(location);
      }

      return eventBlock;
    }

    /**
     * @param {number} currentMinutes Minutos actuales desde medianoche.
     * @param {{startMinutes: number, endMinutes: number}} range Intervalo visible.
     * @returns {HTMLSpanElement} Línea indicadora de la hora actual.
     */
    createCurrentTimeMarker(currentMinutes, range) {
      const { timelineUtils } = global.CalendarApp;
      const marker = document.createElement("span");
      const label = document.createElement("span");
      const top = ((currentMinutes - range.startMinutes) / 60) * timelineUtils.HOUR_HEIGHT;

      marker.className = "current-time-marker";
      marker.style.top = `${top}px`;
      marker.setAttribute("aria-label", `Hora actual: ${timelineUtils.formatMinutes(currentMinutes)}`);
      label.className = "current-time-marker__label";
      label.textContent = timelineUtils.formatMinutes(currentMinutes);
      marker.append(label);

      return marker;
    }
  }

  global.CalendarApp = {
    ...global.CalendarApp,
    TimeGridView,
  };
}(window));
