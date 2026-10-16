(function initializeCalendar() {
  const {
    CalendarView,
    TimeGridView,
    UpcomingEventsView,
    dateUtils,
    eventStorage,
  } = window.CalendarApp;

  const VIEW_LABELS = Object.freeze({
    day: "Vista diaria",
    month: "Vista mensual",
    week: "Vista semanal",
  });

  function getCurrentDate() {
    const currentDate = new Date();

    return dateUtils.createLocalDate(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
    );
  }

  const today = getCurrentDate();
  const state = {
    activeView: "month",
    events: eventStorage.readEvents(),
    selectedDate: today,
    visibleMonth: dateUtils.startOfMonth(today),
  };

  const elements = {
    eyebrow: document.querySelector("#calendar-eyebrow"),
    monthView: document.querySelector("#month-view"),
    nextButton: document.querySelector("#next-month"),
    previousButton: document.querySelector("#previous-month"),
    timeGridView: document.querySelector("#time-grid-view"),
    todayButton: document.querySelector("#today-button"),
    viewButtons: [...document.querySelectorAll("[data-calendar-view]")],
  };

  const calendarView = new CalendarView({
    titleElement: document.querySelector("#calendar-title"),
    daysElement: document.querySelector("#calendar-days"),
    onSelectDate: selectDate,
  });
  const timeGridView = new TimeGridView({
    container: elements.timeGridView,
    titleElement: document.querySelector("#calendar-title"),
  });
  const upcomingEventsView = new UpcomingEventsView(
    document.querySelector("#upcoming-events"),
  );

  function render() {
    const isMonthView = state.activeView === "month";

    elements.eyebrow.textContent = VIEW_LABELS[state.activeView];
    elements.monthView.hidden = !isMonthView;
    elements.timeGridView.hidden = isMonthView;

    elements.viewButtons.forEach((button) => {
      const isActive = button.dataset.calendarView === state.activeView;
      button.classList.toggle("view-switcher__button--active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    updateNavigationLabels();

    if (isMonthView) {
      calendarView.render(state);
    } else {
      timeGridView.render({
        events: state.events,
        mode: state.activeView,
        selectedDate: state.selectedDate,
      });
    }

    upcomingEventsView.render(state.events, getCurrentDate());
  }

  function updateNavigationLabels() {
    const periodName = {
      day: "día",
      month: "mes",
      week: "semana",
    }[state.activeView];

    elements.previousButton.setAttribute("aria-label", `Ver ${periodName} anterior`);
    elements.previousButton.title = `${periodName.charAt(0).toUpperCase()}${periodName.slice(1)} anterior`;
    elements.nextButton.setAttribute("aria-label", `Ver ${periodName} siguiente`);
    elements.nextButton.title = `${periodName.charAt(0).toUpperCase()}${periodName.slice(1)} siguiente`;
  }

  function selectDate(date) {
    state.selectedDate = date;

    if (!dateUtils.isSameMonth(date, state.visibleMonth)) {
      state.visibleMonth = dateUtils.startOfMonth(date);
    }

    render();
  }

  function changePeriod(amount) {
    if (state.activeView === "month") {
      state.visibleMonth = dateUtils.addMonths(state.visibleMonth, amount);
    } else {
      const dayOffset = state.activeView === "week" ? amount * 7 : amount;
      state.selectedDate = dateUtils.addDays(state.selectedDate, dayOffset);
      state.visibleMonth = dateUtils.startOfMonth(state.selectedDate);
    }

    render();
  }

  function changeView(view) {
    if (!VIEW_LABELS[view] || view === state.activeView) {
      return;
    }

    state.activeView = view;
    if (view === "month") {
      state.visibleMonth = dateUtils.startOfMonth(state.selectedDate);
    }

    render();
  }

  function goToToday() {
    const currentDate = getCurrentDate();

    state.selectedDate = currentDate;
    state.visibleMonth = dateUtils.startOfMonth(currentDate);
    render();
  }

  elements.previousButton.addEventListener("click", () => changePeriod(-1));
  elements.nextButton.addEventListener("click", () => changePeriod(1));
  elements.todayButton.addEventListener("click", goToToday);
  elements.viewButtons.forEach((button) => {
    button.addEventListener("click", () => changeView(button.dataset.calendarView));
  });

  render();
}());
