/**
 * Cálculos de tiempo y distribución usados por las vistas Semana y Día.
 */
(function initializeTimelineUtils(global) {
  const DEFAULT_START_MINUTES = 7 * 60;
  const DEFAULT_END_MINUTES = 22 * 60;
  const HOUR_HEIGHT = 56;
  const MIN_EVENT_HEIGHT = 32;

  /**
   * Convierte una hora de 24 horas a minutos transcurridos desde medianoche.
   *
   * @param {unknown} value Hora esperada con formato `HH:mm`.
   * @param {boolean} [allowEndOfDay=false] Permite `24:00` como límite final.
   * @returns {number|null} Minutos desde medianoche o `null` si es inválida.
   */
  function parseTime(value, allowEndOfDay = false) {
    if (allowEndOfDay && value === "24:00") {
      return 24 * 60;
    }

    if (typeof value !== "string") {
      return null;
    }

    const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!match) {
      return null;
    }

    return Number(match[1]) * 60 + Number(match[2]);
  }

  /**
   * Obtiene el intervalo válido de un evento.
   *
   * Si falta una hora final posterior al inicio, se aplica una duración visual
   * de una hora sin modificar el evento original.
   *
   * @param {CalendarEvent} event Evento que se desea posicionar.
   * @returns {{event: CalendarEvent, startMinutes: number, endMinutes: number}|null}
   * Intervalo calculado o `null` cuando no existe una hora inicial válida.
   */
  function getEventInterval(event) {
    const startMinutes = parseTime(event.horaInicio);
    if (startMinutes === null) {
      return null;
    }

    const parsedEnd = parseTime(event.horaFin, true);
    const fallbackEnd = Math.min(startMinutes + 60, 24 * 60);
    const endMinutes = parsedEnd !== null && parsedEnd > startMinutes
      ? parsedEnd
      : fallbackEnd;

    if (endMinutes <= startMinutes) {
      return null;
    }

    return {
      endMinutes,
      event,
      startMinutes,
    };
  }

  /**
   * Calcula el intervalo horario visible e incluye eventos fuera del horario base.
   *
   * @param {CalendarEvent[]} events Eventos visibles en la vista actual.
   * @returns {{startMinutes: number, endMinutes: number}} Límites redondeados a horas.
   */
  function getVisibleRange(events) {
    const intervals = events.map(getEventInterval).filter(Boolean);

    if (intervals.length === 0) {
      return {
        endMinutes: DEFAULT_END_MINUTES,
        startMinutes: DEFAULT_START_MINUTES,
      };
    }

    const firstStart = Math.min(...intervals.map((interval) => interval.startMinutes));
    const lastEnd = Math.max(...intervals.map((interval) => interval.endMinutes));

    return {
      startMinutes: Math.max(0, Math.min(DEFAULT_START_MINUTES, Math.floor(firstStart / 60) * 60)),
      endMinutes: Math.min(24 * 60, Math.max(DEFAULT_END_MINUTES, Math.ceil(lastEnd / 60) * 60)),
    };
  }

  /**
   * @param {{startMinutes: number, endMinutes: number}} range Intervalo visible.
   * @returns {number[]} Marcas horarias expresadas en minutos.
   */
  function getHourMarks({ startMinutes, endMinutes }) {
    const hourCount = Math.floor((endMinutes - startMinutes) / 60);

    return Array.from({ length: hourCount + 1 }, (_, index) => startMinutes + index * 60);
  }

  /** @param {number} minutes @returns {string} Hora con formato `HH:mm`. */
  function formatMinutes(minutes) {
    if (minutes === 24 * 60) {
      return "24:00";
    }

    const hours = Math.floor(minutes / 60) % 24;
    const remainder = minutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }

  /**
   * Asigna carriles a los eventos que se superponen en el tiempo.
   *
   * @param {CalendarEvent[]} events Eventos de una sola fecha.
   * @returns {Array<{
   *   event: CalendarEvent,
   *   startMinutes: number,
   *   endMinutes: number,
   *   lane: number,
   *   laneCount: number
   * }>} Intervalos listos para calcular su posición horizontal.
   */
  function layoutOverlappingEvents(events) {
    const intervals = events
      .map(getEventInterval)
      .filter(Boolean)
      .sort((first, second) => (
        first.startMinutes - second.startMinutes || first.endMinutes - second.endMinutes
      ));
    const groups = [];
    let currentGroup = [];
    let currentGroupEnd = -1;

    intervals.forEach((interval) => {
      if (currentGroup.length > 0 && interval.startMinutes >= currentGroupEnd) {
        groups.push(currentGroup);
        currentGroup = [];
        currentGroupEnd = -1;
      }

      currentGroup.push(interval);
      currentGroupEnd = Math.max(currentGroupEnd, interval.endMinutes);
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups.flatMap((group) => {
      const laneEnds = [];
      const positionedEvents = group.map((interval) => {
        let lane = laneEnds.findIndex((endMinutes) => endMinutes <= interval.startMinutes);

        if (lane === -1) {
          lane = laneEnds.length;
          laneEnds.push(interval.endMinutes);
        } else {
          laneEnds[lane] = interval.endMinutes;
        }

        return { ...interval, lane };
      });
      const laneCount = laneEnds.length;

      return positionedEvents.map((interval) => ({ ...interval, laneCount }));
    });
  }

  /**
   * Convierte un intervalo y su carril en medidas CSS para el bloque visual.
   *
   * @param {{startMinutes: number, endMinutes: number, lane: number, laneCount: number}} interval
   * Evento previamente distribuido.
   * @param {{startMinutes: number, endMinutes: number}} range Intervalo visible.
   * @returns {{top: number, height: number, leftPercentage: number, widthPercentage: number}}
   * Posición y tamaño del bloque.
   */
  function getBlockMetrics(interval, range) {
    const top = ((interval.startMinutes - range.startMinutes) / 60) * HOUR_HEIGHT;
    const rawHeight = ((interval.endMinutes - interval.startMinutes) / 60) * HOUR_HEIGHT;

    return {
      height: Math.max(rawHeight, MIN_EVENT_HEIGHT),
      leftPercentage: (interval.lane / interval.laneCount) * 100,
      top,
      widthPercentage: 100 / interval.laneCount,
    };
  }

  global.CalendarApp = {
    ...global.CalendarApp,
    timelineUtils: Object.freeze({
      DEFAULT_END_MINUTES,
      DEFAULT_START_MINUTES,
      HOUR_HEIGHT,
      formatMinutes,
      getBlockMetrics,
      getEventInterval,
      getHourMarks,
      getVisibleRange,
      layoutOverlappingEvents,
      parseTime,
    }),
  };
}(window));
