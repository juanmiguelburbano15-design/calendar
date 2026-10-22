/**
 * Punto de entrada de la aplicación.
 *
 * Coordina el estado compartido, las vistas y los controles de navegación.
 * Las dependencias se obtienen de `window.CalendarApp` porque el proyecto no
 * utiliza un sistema de módulos ni un proceso de compilación.
 */
(function initializeCalendar() {
  const {
    CalendarView,
    ConfirmationDialog,
    MiniCalendarView,
    SettingsView,
    TimeGridView,
    UpcomingEventsView,
    categoryStorage,
    dateUtils,
    eventStorage,
    settingsStorage,
  } = window.CalendarApp;

  const VIEW_LABELS = Object.freeze({
    day: "Vista diaria",
    month: "Vista mensual",
    week: "Vista semanal",
  });

  /**
   * Obtiene la fecha local actual normalizada por las utilidades del proyecto.
   *
   * @returns {Date} Fecha local de hoy, fijada al mediodía.
   */
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
    activeModule: globalThis.location.hash === "#configuracion" ? "settings" : "calendar",
    activeView: "month",
    categories: categoryStorage.readCategories(),
    events: eventStorage.readEvents(),
    selectedDate: today,
    settings: settingsStorage.readSettings(),
    visibleMonth: dateUtils.startOfMonth(today),
  };

  applyTheme(state.settings.theme);

  const elements = {
    calendarWorkspace: document.querySelector("#calendario"),
    eyebrow: document.querySelector("#calendar-eyebrow"),
    moduleButtons: [...document.querySelectorAll("[data-module-target]")],
    monthView: document.querySelector("#month-view"),
    nextButton: document.querySelector("#next-month"),
    previousButton: document.querySelector("#previous-month"),
    settingsWorkspace: document.querySelector("#configuracion"),
    timeGridView: document.querySelector("#time-grid-view"),
    todayButton: document.querySelector("#today-button"),
    upcomingPanel: document.querySelector(".upcoming-panel"),
    viewButtons: [...document.querySelectorAll("[data-calendar-view]")],
  };

  const calendarView = new CalendarView({
    titleElement: document.querySelector("#calendar-title"),
    daysElement: document.querySelector("#calendar-days"),
    weekdaysElement: document.querySelector("#calendar-weekdays"),
    onSelectDate: selectDate,
  });
  const timeGridView = new TimeGridView({
    container: elements.timeGridView,
    titleElement: document.querySelector("#calendar-title"),
  });
  const miniCalendarView = new MiniCalendarView({
    container: document.querySelector("#mini-calendar"),
    nextButton: document.querySelector("#mini-calendar-next"),
    onNavigate: changePeriod,
    previousButton: document.querySelector("#mini-calendar-previous"),
    titleElement: document.querySelector("#mini-calendar-title"),
    viewTitleElement: document.querySelector("#mini-calendar-view-title"),
  });
  const upcomingEventsView = new UpcomingEventsView({
    countElement: document.querySelector("#upcoming-count"),
    container: document.querySelector("#upcoming-events"),
    titleElement: document.querySelector("#upcoming-title"),
  });
  const confirmationDialog = new ConfirmationDialog({
    fallbackFocus: document.querySelector("#sidebar-add-category"),
    root: document.querySelector("#confirmation-modal"),
  });
  const settingsView = new SettingsView({
    addButton: document.querySelector("#settings-add-category"),
    categoriesContainer: document.querySelector("#settings-categories"),
    confirmationDialog,
    feedback: document.querySelector("#settings-feedback"),
    firstDaySelect: document.querySelector("#first-day-select"),
    form: document.querySelector("#category-form"),
    modal: document.querySelector("#category-modal"),
    onCreateCategory: createCategory,
    onDeleteCategory: deleteCategory,
    onFirstDayChange: changeFirstDayOfWeek,
    onThemeChange: changeTheme,
    onUpdateCategory: updateCategory,
    sidebarAddButton: document.querySelector("#sidebar-add-category"),
    sidebarCategories: document.querySelector("#sidebar-category-list"),
    themeSelect: document.querySelector("#theme-select"),
  });

  /**
   * Sincroniza los controles y vuelve a dibujar la vista activa.
   *
   * La lista de próximos eventos se actualiza siempre, sin importar qué vista
   * central esté seleccionada.
   *
   * @returns {void}
   */
  function render() {
    const isCalendarModule = state.activeModule === "calendar";
    const isMonthView = state.activeView === "month";

    applyTheme(state.settings.theme);
    elements.calendarWorkspace.hidden = !isCalendarModule;
    elements.settingsWorkspace.hidden = isCalendarModule;
    elements.upcomingPanel.hidden = !isCalendarModule;
    elements.moduleButtons.forEach((button) => {
      const isActive = button.dataset.moduleTarget === state.activeModule;
      if (button.closest(".main-nav")) {
        button.classList.toggle("nav-item--active", isActive);
        if (isActive) {
          button.setAttribute("aria-current", "page");
        } else {
          button.removeAttribute("aria-current");
        }
      }
    });
    settingsView.render(state);

    if (!isCalendarModule) {
      return;
    }

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
        categories: state.categories,
        events: state.events,
        mode: state.activeView,
        selectedDate: state.selectedDate,
        settings: state.settings,
      });
    }

    miniCalendarView.render(state);
    upcomingEventsView.render(state);
  }

  /**
   * Abre uno de los módulos implementados y conserva el estado del calendario.
   *
   * @param {"calendar"|"settings"} moduleName Módulo de destino.
   * @returns {void}
   */
  function changeModule(moduleName) {
    if (!["calendar", "settings"].includes(moduleName)) {
      return;
    }

    state.activeModule = moduleName;
    globalThis.history.replaceState(
      null,
      "",
      moduleName === "settings" ? "#configuracion" : "#calendario",
    );
    render();
  }

  /**
   * Persiste el inicio semanal y actualiza todas las vistas dependientes.
   *
   * @param {"monday"|"sunday"} firstDayOfWeek Nuevo inicio semanal.
   * @returns {{ok: boolean, error?: string}}
   */
  function changeFirstDayOfWeek(firstDayOfWeek) {
    const nextSettings = settingsStorage.normalizeSettings({
      ...state.settings,
      firstDayOfWeek,
    });

    if (!settingsStorage.writeSettings(nextSettings)) {
      render();
      return { error: "No fue posible guardar la preferencia en este navegador.", ok: false };
    }

    state.settings = nextSettings;
    render();
    return { ok: true };
  }

  /**
   * Persiste y aplica el tema visual elegido por la persona usuaria.
   *
   * @param {string} theme Tema solicitado.
   * @returns {{ok: boolean, error?: string}}
   */
  function changeTheme(theme) {
    const nextSettings = settingsStorage.normalizeSettings({
      ...state.settings,
      theme,
    });

    if (!settingsStorage.writeSettings(nextSettings)) {
      render();
      return { error: "No fue posible guardar el tema en este navegador.", ok: false };
    }

    state.settings = nextSettings;
    render();
    return { ok: true };
  }

  /**
   * Expone el tema a CSS mediante el atributo `data-theme` del documento.
   *
   * @param {string} theme Tema normalizado.
   * @returns {void}
   */
  function applyTheme(theme) {
    const darkColorSchemes = ["dark", "midnight", "forest", "graphite"];

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = darkColorSchemes.includes(theme) ? "dark" : "light";
  }

  /**
   * @param {{name: string, color: string}} input Datos validados por el dominio.
   * @returns {{ok: boolean, error?: string}}
   */
  function createCategory(input) {
    const result = categoryStorage.createCategory(state.categories, input);
    return persistCategoryResult(result);
  }

  /**
   * @param {string} id Identificador estable.
   * @param {{name: string, color: string}} input Datos del formulario.
   * @returns {{ok: boolean, error?: string}}
   */
  function updateCategory(id, input) {
    const result = categoryStorage.updateCategory(state.categories, id, input);
    return persistCategoryResult(result);
  }

  /**
   * Elimina una categoría solamente cuando no contiene eventos relacionados.
   *
   * @param {string} id Identificador estable.
   * @returns {{ok: boolean, error?: string}}
   */
  function deleteCategory(id) {
    const category = state.categories.find((item) => item.id === id);
    if (!category) {
      return { error: "La categoría ya no está disponible.", ok: false };
    }
    if (categoryStorage.categoryHasEvents(state.events, category)) {
      return {
        error: "No puedes eliminar esta categoría porque tiene eventos asociados. Reasígnalos primero.",
        ok: false,
      };
    }

    return persistCategoryResult({
      categories: state.categories.filter((item) => item.id !== id),
      ok: true,
    });
  }

  /**
   * Guarda el resultado de una operación de categorías antes de cambiar el estado.
   *
   * @param {{ok: boolean, categories?: CalendarCategory[], error?: string}} result Resultado de dominio.
   * @returns {{ok: boolean, error?: string}}
   */
  function persistCategoryResult(result) {
    if (!result.ok) {
      return result;
    }
    if (!categoryStorage.writeCategories(result.categories)) {
      return { error: "No fue posible guardar las categorías en este navegador.", ok: false };
    }

    state.categories = result.categories;
    render();
    return { ok: true };
  }

  /**
   * Adapta las etiquetas accesibles de navegación al periodo activo.
   *
   * @returns {void}
   */
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

  /**
   * Selecciona una fecha y mantiene sincronizado el mes visible.
   *
   * @param {Date} date Fecha elegida en la cuadrícula mensual.
   * @returns {void}
   */
  function selectDate(date) {
    state.selectedDate = date;

    if (!dateUtils.isSameMonth(date, state.visibleMonth)) {
      state.visibleMonth = dateUtils.startOfMonth(date);
    }

    render();
  }

  /**
   * Desplaza el periodo visible según la vista activa.
   *
   * En Mes desplaza meses; en Semana desplaza bloques de siete días; en Día
   * desplaza días individuales.
   *
   * @param {number} amount Cantidad de periodos; normalmente `-1` o `1`.
   * @returns {void}
   */
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

  /**
   * Cambia la vista central conservando la fecha seleccionada.
   *
   * @param {"month"|"week"|"day"} view Identificador de la nueva vista.
   * @returns {void}
   */
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

  /**
   * Restablece la selección y el periodo visible a la fecha actual.
   *
   * @returns {void}
   */
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
  elements.moduleButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      changeModule(button.dataset.moduleTarget);
    });
  });

  render();
}());
