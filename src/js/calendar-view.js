(function initializeCalendarView(global) {
  const CATEGORY_CLASS = Object.freeze({
    universidad: "university",
    trabajo: "work",
    personal: "personal",
    salud: "health",
    otros: "other",
  });

  function normalizeCategory(value) {
    const normalizedValue = String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    return CATEGORY_CLASS[normalizedValue] || CATEGORY_CLASS.otros;
  }

  class CalendarView {
    constructor({ titleElement, daysElement, onSelectDate }) {
      this.titleElement = titleElement;
      this.daysElement = daysElement;
      this.onSelectDate = onSelectDate;
    }

    render({ visibleMonth, selectedDate, events }) {
      const { dateUtils } = global.CalendarApp;
      const today = new Date();
      const dates = dateUtils.getMonthGridDates(visibleMonth);
      const eventsByDate = this.groupEventsByDate(events);

      this.titleElement.textContent = dateUtils.formatMonthTitle(visibleMonth);
      this.daysElement.replaceChildren();

      dates.forEach((date) => {
        const dateKey = dateUtils.getDateKey(date);
        const dayEvents = eventsByDate.get(dateKey) || [];
        const dayButton = this.createDayButton({
          date,
          dayEvents,
          isCurrentMonth: dateUtils.isSameMonth(date, visibleMonth),
          isSelected: dateUtils.isSameDay(date, selectedDate),
          isToday: dateUtils.isSameDay(date, today),
        });

        this.daysElement.append(dayButton);
      });
    }

    groupEventsByDate(events) {
      return events.reduce((eventsByDate, event) => {
        const eventsForDay = eventsByDate.get(event.fecha) || [];
        eventsForDay.push(event);
        eventsByDate.set(event.fecha, eventsForDay);
        return eventsByDate;
      }, new Map());
    }

    createDayButton({ date, dayEvents, isCurrentMonth, isSelected, isToday }) {
      const { dateUtils } = global.CalendarApp;
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
        eventChip.className = `event-chip event-chip--${normalizeCategory(event.categoria)}`;
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
