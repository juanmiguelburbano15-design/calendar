(function initializeDateUtils(global) {
  const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

  function createLocalDate(year, month, day) {
    return new Date(year, month, day, 12, 0, 0, 0);
  }

  function startOfMonth(date) {
    return createLocalDate(date.getFullYear(), date.getMonth(), 1);
  }

  function addMonths(date, amount) {
    return createLocalDate(date.getFullYear(), date.getMonth() + amount, 1);
  }

  function addDays(date, amount) {
    return createLocalDate(date.getFullYear(), date.getMonth(), date.getDate() + amount);
  }

  function startOfWeek(date) {
    const daysFromMonday = (date.getDay() + 6) % 7;
    return addDays(date, -daysFromMonday);
  }

  function getWeekDates(date) {
    const monday = startOfWeek(date);

    return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  }

  function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

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

  function isSameDay(firstDate, secondDate) {
    return getDateKey(firstDate) === getDateKey(secondDate);
  }

  function isSameMonth(firstDate, secondDate) {
    return firstDate.getFullYear() === secondDate.getFullYear()
      && firstDate.getMonth() === secondDate.getMonth();
  }

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

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function formatMonthTitle(date) {
    const value = new Intl.DateTimeFormat("es-CO", {
      month: "long",
      year: "numeric",
    }).format(date);

    return capitalize(value);
  }

  function formatLongDate(date) {
    return new Intl.DateTimeFormat("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  function formatDayTitle(date) {
    return capitalize(formatLongDate(date));
  }

  function formatWeekday(date) {
    return capitalize(new Intl.DateTimeFormat("es-CO", {
      weekday: "short",
    }).format(date).replace(".", ""));
  }

  function formatDayAndMonth(date) {
    return new Intl.DateTimeFormat("es-CO", {
      day: "numeric",
      month: "short",
    }).format(date);
  }

  function formatMonthName(date) {
    return new Intl.DateTimeFormat("es-CO", { month: "long" }).format(date);
  }

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
