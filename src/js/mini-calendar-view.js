/**
 * Mini calendario sincronizado del panel derecho.
 */
(function initializeMiniCalendarView(global) {
  const VIEW_TITLES = Object.freeze({
    day: "Vista diaria",
    month: "Vista mensual",
    week: "Vista semanal",
  });

  /** Renderiza el contexto mensual y la selección del calendario principal. */
  class MiniCalendarView {
    /**
     * @param {Object} options Dependencias de la vista.
     * @param {HTMLElement} options.container Contenedor de la cuadrícula.
     * @param {HTMLButtonElement} options.nextButton Botón para avanzar el periodo.
     * @param {(amount: number) => void} options.onNavigate Navegación compartida.
     * @param {HTMLButtonElement} options.previousButton Botón para retroceder el periodo.
     * @param {HTMLElement} options.titleElement Título del mes visible.
     * @param {HTMLElement} options.viewTitleElement Nombre de la vista activa.
     */
    constructor({
      container,
      nextButton,
      onNavigate,
      previousButton,
      titleElement,
      viewTitleElement,
    }) {
      this.container = container;
      this.nextButton = nextButton;
      this.previousButton = previousButton;
      this.titleElement = titleElement;
      this.viewTitleElement = viewTitleElement;

      this.previousButton.addEventListener("click", () => onNavigate(-1));
      this.nextButton.addEventListener("click", () => onNavigate(1));
    }

    /**
     * Sincroniza el mes visible y el rango resaltado con el estado principal.
     *
     * @param {Object} state Estado actual del calendario.
     * @param {"month"|"week"|"day"} state.activeView Vista activa.
     * @param {Date} state.selectedDate Fecha seleccionada.
     * @param {Date} state.visibleMonth Mes visible en la vista mensual.
     * @param {{firstDayOfWeek: "monday"|"sunday"}} state.settings Preferencias.
     * @returns {void}
     */
    render({ activeView, selectedDate, visibleMonth, settings }) {
      const { dateUtils } = global.CalendarApp;
      const contextMonth = activeView === "month"
        ? visibleMonth
        : dateUtils.startOfMonth(selectedDate);
      const dates = dateUtils.getMonthGridDates(contextMonth, settings.firstDayOfWeek);
      const selectedKeys = this.getSelectedKeys(activeView, selectedDate, settings.firstDayOfWeek);
      const selectedWeek = activeView === "week"
        ? dateUtils.getWeekDates(selectedDate, settings.firstDayOfWeek)
        : [];
      const weekStartKey = selectedWeek.length ? dateUtils.getDateKey(selectedWeek[0]) : "";
      const weekEndKey = selectedWeek.length ? dateUtils.getDateKey(selectedWeek[6]) : "";
      const grid = document.createElement("div");

      this.viewTitleElement.textContent = VIEW_TITLES[activeView];
      this.titleElement.textContent = dateUtils.formatMonthTitle(contextMonth);
      this.previousButton.setAttribute("aria-label", `Ver ${this.getPeriodName(activeView)} anterior`);
      this.nextButton.setAttribute("aria-label", `Ver ${this.getPeriodName(activeView)} siguiente`);
      grid.className = "mini-calendar";
      grid.setAttribute("role", "grid");
      grid.setAttribute("aria-label", `Mini calendario de ${dateUtils.formatMonthTitle(contextMonth)}`);

      dateUtils.getWeekdayLabels(settings.firstDayOfWeek, true).forEach((weekday) => {
        const label = document.createElement("span");
        label.className = "mini-calendar__weekday";
        label.setAttribute("role", "columnheader");
        label.textContent = weekday;
        grid.append(label);
      });

      dates.forEach((date) => {
        grid.append(this.createDay({
          activeView,
          contextMonth,
          date,
          isAnchor: dateUtils.isSameDay(date, selectedDate),
          isSelected: selectedKeys.has(dateUtils.getDateKey(date)),
          isWeekStart: dateUtils.getDateKey(date) === weekStartKey,
          isWeekEnd: dateUtils.getDateKey(date) === weekEndKey,
        }));
      });

      this.container.replaceChildren(grid);
    }

    /**
     * @param {"month"|"week"|"day"} activeView Vista activa.
     * @returns {string} Nombre del periodo para las etiquetas accesibles.
     */
    getPeriodName(activeView) {
      return {
        day: "día",
        month: "mes",
        week: "semana",
      }[activeView];
    }

    /**
     * @param {"month"|"week"|"day"} activeView Vista activa.
     * @param {Date} selectedDate Fecha seleccionada.
     * @param {"monday"|"sunday"} firstDayOfWeek Inicio configurado.
     * @returns {Set<string>} Claves de los días que deben resaltarse.
     */
    getSelectedKeys(activeView, selectedDate, firstDayOfWeek) {
      const { dateUtils } = global.CalendarApp;
      const selectedDates = activeView === "week"
        ? dateUtils.getWeekDates(selectedDate, firstDayOfWeek)
        : [selectedDate];

      return new Set(selectedDates.map(dateUtils.getDateKey));
    }

    /**
     * Crea una celda del mini calendario con su estado accesible y visual.
     *
     * @param {Object} options Datos de la celda.
     * @param {"month"|"week"|"day"} options.activeView Vista activa.
     * @param {Date} options.contextMonth Mes mostrado.
     * @param {Date} options.date Fecha representada.
     * @param {boolean} options.isAnchor Indica si es la fecha principal seleccionada.
     * @param {boolean} options.isSelected Indica si pertenece a la selección.
     * @param {boolean} options.isWeekStart Indica el inicio visual de la banda.
     * @param {boolean} options.isWeekEnd Indica el final visual de la banda.
     * @returns {HTMLSpanElement} Celda lista para insertar.
     */
    createDay({ activeView, contextMonth, date, isAnchor, isSelected, isWeekStart, isWeekEnd }) {
      const { dateUtils } = global.CalendarApp;
      const day = document.createElement("span");
      const isWeekSelection = activeView === "week" && isSelected;

      day.className = "mini-calendar__day";
      day.setAttribute("role", "gridcell");
      day.setAttribute("aria-label", dateUtils.formatLongDate(date));
      day.setAttribute("aria-selected", String(isSelected));
      day.textContent = String(date.getDate());

      if (!dateUtils.isSameMonth(date, contextMonth)) {
        day.classList.add("mini-calendar__day--outside");
      }

      if (isWeekSelection) {
        day.classList.add("mini-calendar__day--week");
        if (isAnchor) {
          day.classList.add("mini-calendar__day--week-anchor");
        }
        if (isWeekStart) {
          day.classList.add("mini-calendar__day--week-start");
        }
        if (isWeekEnd) {
          day.classList.add("mini-calendar__day--week-end");
        }
      } else if (isSelected) {
        day.classList.add("mini-calendar__day--selected");
      }

      return day;
    }
  }

  global.CalendarApp = {
    ...global.CalendarApp,
    MiniCalendarView,
  };
}(window));
