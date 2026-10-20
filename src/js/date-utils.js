/**
 * Utilidades puras para crear, comparar, recorrer y presentar fechas locales.
 *
 * Las fechas se crean a las 12:00 para reducir el riesgo de que una conversión
 * de zona horaria las desplace al día anterior o siguiente.
 */
(function initializeDateUtils(global) {
  const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

  /**
   * Crea una fecha local normalizada al mediodía.
   *
   * @param {number} year Año completo.
   * @param {number} month Índice de mes basado en cero.
   * @param {number} day Día del mes.
   * @returns {Date} Fecha local normalizada.
   */
  function createLocalDate(year, month, day) {
    return new Date(year, month, day, 12, 0, 0, 0);
  }

  /** @param {Date} date @returns {Date} Primer día del mes de `date`. */
  function startOfMonth(date) {
    return createLocalDate(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * Desplaza una fecha por meses y devuelve el primer día del mes resultante.
   *
   * @param {Date} date Fecha de referencia.
   * @param {number} amount Meses que se deben sumar o restar.
   * @returns {Date} Primer día del mes desplazado.
   */
  function addMonths(date, amount) {
    return createLocalDate(date.getFullYear(), date.getMonth() + amount, 1);
  }

  /**
   * Desplaza una fecha por días sin mutar el valor recibido.
   *
   * @param {Date} date Fecha de referencia.
   * @param {number} amount Días que se deben sumar o restar.
   * @returns {Date} Nueva fecha desplazada.
   */
  function addDays(date, amount) {
    return createLocalDate(date.getFullYear(), date.getMonth(), date.getDate() + amount);
  }

  /** @param {Date} date @returns {Date} Lunes de la semana que contiene la fecha. */
  function startOfWeek(date) {
    const daysFromMonday = (date.getDay() + 6) % 7;
    return addDays(date, -daysFromMonday);
  }

  /** @param {Date} date @returns {Date[]} Siete fechas consecutivas de lunes a domingo. */
  function getWeekDates(date) {
    const monday = startOfWeek(date);

    return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  }

  /** @param {Date} date @returns {string} Clave local con formato `YYYY-MM-DD`. */
  function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  /**
   * Convierte una clave `YYYY-MM-DD` válida en una fecha local.
   *
   * @param {unknown} value Valor que se desea validar.
   * @returns {Date|null} Fecha normalizada o `null` si la clave no es válida.
   */
  function parseDateKey(value) {
    if (typeof value !== "string") {
      return null;
    }

    const match = value.match(DATE_KEY_PATTERN);
    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = createLocalDate(year, month, day);

    return getDateKey(date) === value ? date : null;
  }

  /**
   * @param {Date} firstDate Primera fecha.
   * @param {Date} secondDate Segunda fecha.
   * @returns {boolean} `true` cuando ambas fechas representan el mismo día local.
   */
  function isSameDay(firstDate, secondDate) {
    return getDateKey(firstDate) === getDateKey(secondDate);
  }

  /**
   * @param {Date} firstDate Primera fecha.
   * @param {Date} secondDate Segunda fecha.
   * @returns {boolean} `true` cuando ambas fechas pertenecen al mismo mes y año.
   */
  function isSameMonth(firstDate, secondDate) {
    return firstDate.getFullYear() === secondDate.getFullYear()
      && firstDate.getMonth() === secondDate.getMonth();
  }

  /**
   * Genera todas las fechas necesarias para completar la cuadrícula mensual.
   *
   * Incluye los días adyacentes desde el lunes inicial hasta el domingo final.
   *
   * @param {Date} monthDate Cualquier fecha del mes que se desea mostrar.
   * @returns {Date[]} Fechas completas de la cuadrícula.
   */
  function getMonthGridDates(monthDate) {
    const firstDay = startOfMonth(monthDate);
    const lastDay = createLocalDate(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    const leadingDays = (firstDay.getDay() + 6) % 7;
    const trailingDays = 6 - ((lastDay.getDay() + 6) % 7);
    const daysInMonth = lastDay.getDate();
    const totalDays = leadingDays + daysInMonth + trailingDays;
    const gridStart = createLocalDate(firstDay.getFullYear(), firstDay.getMonth(), 1 - leadingDays);

    return Array.from({ length: totalDays }, (_, index) => (
      createLocalDate(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index)
    ));
  }

  /** @param {string} value @returns {string} Texto con la inicial en mayúscula. */
  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  /** @param {Date} date @returns {string} Mes y año en español. */
  function formatMonthTitle(date) {
    const value = new Intl.DateTimeFormat("es-CO", {
      month: "long",
      year: "numeric",
    }).format(date);

    return capitalize(value);
  }

  /** @param {Date} date @returns {string} Fecha larga localizada en español de Colombia. */
  function formatLongDate(date) {
    return new Intl.DateTimeFormat("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  /** @param {Date} date @returns {string} Título localizado para la vista Día. */
  function formatDayTitle(date) {
    return capitalize(formatLongDate(date));
  }

  /** @param {Date} date @returns {string} Nombre corto del día de la semana. */
  function formatWeekday(date) {
    return capitalize(new Intl.DateTimeFormat("es-CO", {
      weekday: "short",
    }).format(date).replace(".", ""));
  }

  /** @param {Date} date @returns {string} Día y mes abreviado. */
  function formatDayAndMonth(date) {
    return new Intl.DateTimeFormat("es-CO", {
      day: "numeric",
      month: "short",
    }).format(date);
  }

  /** @param {Date} date @returns {string} Nombre completo del mes en español. */
  function formatMonthName(date) {
    return new Intl.DateTimeFormat("es-CO", { month: "long" }).format(date);
  }

  /**
   * Construye el intervalo legible de la semana que contiene una fecha.
   *
   * @param {Date} date Fecha contenida en la semana.
   * @returns {string} Intervalo semanal adaptado a cambios de mes o año.
   */
  function formatWeekTitle(date) {
    const weekDates = getWeekDates(date);
    const start = weekDates[0];
    const end = weekDates[6];
    const sameYear = start.getFullYear() === end.getFullYear();
    const sameMonth = sameYear && start.getMonth() === end.getMonth();

    if (sameMonth) {
      return `${start.getDate()} – ${end.getDate()} de ${formatMonthName(start)} de ${start.getFullYear()}`;
    }

    if (sameYear) {
      return `${start.getDate()} de ${formatMonthName(start)} – ${end.getDate()} de ${formatMonthName(end)} de ${start.getFullYear()}`;
    }

    return `${start.getDate()} de ${formatMonthName(start)} de ${start.getFullYear()} – ${end.getDate()} de ${formatMonthName(end)} de ${end.getFullYear()}`;
  }

  /** @param {Date} date @returns {string} Fecha breve para la lista de próximos eventos. */
  function formatUpcomingDate(date) {
    return new Intl.DateTimeFormat("es-CO", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(date);
  }

  global.CalendarApp = {
    ...global.CalendarApp,
    dateUtils: Object.freeze({
      addDays,
      addMonths,
      createLocalDate,
      formatDayAndMonth,
      formatDayTitle,
      formatLongDate,
      formatMonthTitle,
      formatUpcomingDate,
      formatWeekTitle,
      formatWeekday,
      getDateKey,
      getMonthGridDates,
      getWeekDates,
      isSameDay,
      isSameMonth,
      parseDateKey,
      startOfMonth,
      startOfWeek,
    }),
  };
}(window));
