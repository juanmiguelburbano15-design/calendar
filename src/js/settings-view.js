/**
 * Interfaz del módulo Configuración y del formulario compartido de categorías.
 */
(function initializeSettingsView(global) {
  /** Renderiza preferencias, categorías y controla el modal de edición. */
  class SettingsView {
    /**
     * @param {Object} options Dependencias y acciones coordinadas por `script.js`.
     * @param {HTMLElement} options.categoriesContainer Lista del módulo Configuración.
     * @param {HTMLButtonElement} options.addButton Acción principal para crear.
     * @param {HTMLButtonElement} options.sidebarAddButton Acción `+` del sidebar.
     * @param {HTMLElement} options.sidebarCategories Lista resumida del sidebar.
     * @param {HTMLSelectElement} options.firstDaySelect Selector de inicio semanal.
     * @param {HTMLSelectElement} options.themeSelect Selector del tema visual.
     * @param {HTMLElement} options.feedback Mensajes persistentes del módulo.
     * @param {ConfirmationDialog} options.confirmationDialog Confirmación destructiva reutilizable.
     * @param {HTMLElement} options.modal Contenedor de la ventana modal.
     * @param {HTMLFormElement} options.form Formulario de categoría.
     * @param {(value: "monday"|"sunday") => {ok: boolean, error?: string}} options.onFirstDayChange Acción de preferencia.
     * @param {(value: string) => {ok: boolean, error?: string}} options.onThemeChange Acción de tema.
     * @param {(input: {name: string, color: string}) => {ok: boolean, error?: string}} options.onCreateCategory Acción de creación.
     * @param {(id: string, input: {name: string, color: string}) => {ok: boolean, error?: string}} options.onUpdateCategory Acción de edición.
     * @param {(id: string) => {ok: boolean, error?: string}} options.onDeleteCategory Acción de eliminación.
     */
    constructor(options) {
      Object.assign(this, options);
      this.categories = [];
      this.editingId = null;
      this.modalTitle = this.modal.querySelector("#category-modal-title");
      this.nameInput = this.form.querySelector("#category-name");
      this.colorInput = this.form.querySelector("#category-color");
      this.colorValue = this.form.querySelector("#category-color-value");
      this.formError = this.form.querySelector("#category-form-error");
      this.cancelButton = this.form.querySelector("#category-cancel");
      this.closeButton = this.modal.querySelector("#category-close");
      this.bindEvents();
    }

    /** Registra listeners una sola vez. @returns {void} */
    bindEvents() {
      this.themeSelect.addEventListener("change", () => {
        const result = this.onThemeChange(this.themeSelect.value);
        if (!result.ok) {
          this.showFeedback(result.error, "error");
        } else {
          this.showFeedback("El tema se guardó correctamente.", "success");
        }
      });
      this.firstDaySelect.addEventListener("change", () => {
        const result = this.onFirstDayChange(this.firstDaySelect.value);
        if (!result.ok) {
          this.showFeedback(result.error, "error");
        } else {
          this.showFeedback("La preferencia se guardó correctamente.", "success");
        }
      });
      this.addButton.addEventListener("click", () => this.openCreateModal(this.addButton));
      this.sidebarAddButton.addEventListener("click", () => this.openCreateModal(this.sidebarAddButton));
      this.cancelButton.addEventListener("click", () => this.closeModal());
      this.closeButton.addEventListener("click", () => this.closeModal());
      this.modal.querySelector("[data-close-category-modal]").addEventListener("click", () => this.closeModal());
      this.colorInput.addEventListener("input", () => {
        this.colorValue.textContent = this.colorInput.value.toUpperCase();
      });
      this.form.addEventListener("submit", (event) => this.handleSubmit(event));
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !this.modal.hidden) {
          this.closeModal();
        }
      });
    }

    /**
     * Sincroniza la pantalla con el estado persistido.
     *
     * @param {Object} state Estado global.
     * @param {{firstDayOfWeek: string, theme: string}} state.settings Preferencias actuales.
     * @param {CalendarCategory[]} state.categories Categorías actuales.
     * @returns {void}
     */
    render({ settings, categories }) {
      this.categories = categories;
      this.themeSelect.value = settings.theme;
      this.firstDaySelect.value = settings.firstDayOfWeek;
      this.renderCategoryRows();
      this.renderSidebarCategories();
    }

    /** @returns {void} Reconstruye las filas editables. */
    renderCategoryRows() {
      this.categoriesContainer.replaceChildren();

      if (this.categories.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "settings-empty";
        emptyMessage.textContent = "Todavía no hay categorías. Crea una para organizar tus eventos.";
        this.categoriesContainer.append(emptyMessage);
        return;
      }

      this.categories.forEach((category) => {
        const row = document.createElement("div");
        const identity = document.createElement("div");
        const dot = document.createElement("span");
        const name = document.createElement("span");
        const actions = document.createElement("div");
        const editButton = this.createActionButton("Editar", "M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4");
        const deleteButton = this.createActionButton("Eliminar", "M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5", true);

        row.className = "settings-category-row";
        identity.className = "settings-category-row__identity";
        dot.className = "category-dot";
        dot.style.backgroundColor = category.color;
        dot.setAttribute("aria-hidden", "true");
        name.textContent = category.name;
        actions.className = "settings-category-row__actions";
        editButton.addEventListener("click", () => this.openEditModal(category.id));
        deleteButton.addEventListener("click", () => this.requestDelete(category, deleteButton));
        identity.append(dot, name);
        actions.append(editButton, deleteButton);
        row.append(identity, actions);
        this.categoriesContainer.append(row);
      });
    }

    /**
     * Sincroniza el sidebar y conecta la papelera visual del proyecto.
     * El control se revela mediante hover o foco y conserva una etiqueta accesible.
     *
     * @returns {void}
     */
    renderSidebarCategories() {
      this.sidebarCategories.replaceChildren();
      this.categories.forEach((category) => {
        const item = document.createElement("li");
        const content = document.createElement("span");
        const dot = document.createElement("span");
        const deleteButton = document.createElement("button");
        const deleteIcon = document.createElement("span");

        item.className = "sidebar-category";
        content.className = "sidebar-category__content";
        dot.className = "category-dot";
        dot.style.backgroundColor = category.color;
        dot.setAttribute("aria-hidden", "true");
        deleteButton.type = "button";
        deleteButton.className = "sidebar-category__delete";
        deleteButton.setAttribute("aria-label", `Eliminar categoría ${category.name}`);
        deleteButton.title = `Eliminar categoría ${category.name}`;
        deleteIcon.className = "sidebar-category__trash-icon";
        deleteIcon.setAttribute("aria-hidden", "true");
        deleteButton.addEventListener("click", () => this.requestDelete(category, deleteButton));
        content.append(dot, document.createTextNode(category.name));
        deleteButton.append(deleteIcon);
        item.append(content, deleteButton);
        this.sidebarCategories.append(item);
      });
    }

    /**
     * @param {string} label Etiqueta accesible.
     * @param {string} path Trazado SVG.
     * @param {boolean} [isDanger=false] Aplica estilo destructivo.
     * @returns {HTMLButtonElement}
     */
    createActionButton(label, path, isDanger = false) {
      const button = document.createElement("button");
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const iconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      button.type = "button";
      button.className = `settings-icon-button${isDanger ? " settings-icon-button--danger" : ""}`;
      button.setAttribute("aria-label", `${label} categoría`);
      button.title = `${label} categoría`;
      icon.setAttribute("viewBox", "0 0 24 24");
      icon.setAttribute("aria-hidden", "true");
      iconPath.setAttribute("d", path);
      icon.append(iconPath);
      button.append(icon);
      return button;
    }

    /**
     * Abre el formulario vacío con el color primario oficial.
     *
     * @param {HTMLElement} [trigger=this.addButton] Control que recuperará el foco.
     * @returns {void}
     */
    openCreateModal(trigger = this.addButton) {
      const primaryColor = global.getComputedStyle(global.document.documentElement)
        .getPropertyValue("--color-primary")
        .trim();

      this.editingId = null;
      this.returnFocus = trigger;
      this.modalTitle.textContent = "Nueva categoría";
      this.form.reset();
      this.colorInput.value = primaryColor;
      this.colorValue.textContent = primaryColor.toUpperCase();
      this.formError.textContent = "";
      this.modal.hidden = false;
      document.body.classList.add("modal-open");
      this.nameInput.focus();
    }

    /**
     * @param {string} id Identificador de la categoría.
     * @returns {void}
     */
    openEditModal(id) {
      const category = this.categories.find((item) => item.id === id);
      if (!category) {
        return;
      }

      this.editingId = id;
      this.returnFocus = document.activeElement;
      this.modalTitle.textContent = "Editar categoría";
      this.nameInput.value = category.name;
      this.colorInput.value = category.color;
      this.colorValue.textContent = category.color;
      this.formError.textContent = "";
      this.modal.hidden = false;
      document.body.classList.add("modal-open");
      this.nameInput.focus();
      this.nameInput.select();
    }

    /** Cierra el modal y devuelve el foco a la acción de creación. @returns {void} */
    closeModal() {
      this.modal.hidden = true;
      document.body.classList.remove("modal-open");
      this.formError.textContent = "";
      if (this.returnFocus && typeof this.returnFocus.focus === "function") {
        this.returnFocus.focus();
      }
    }

    /**
     * Envía una creación o edición al coordinador.
     *
     * @param {SubmitEvent} event Envío del formulario.
     * @returns {void}
     */
    handleSubmit(event) {
      event.preventDefault();
      const input = { color: this.colorInput.value, name: this.nameInput.value };
      const result = this.editingId
        ? this.onUpdateCategory(this.editingId, input)
        : this.onCreateCategory(input);

      if (!result.ok) {
        this.formError.textContent = result.error;
        return;
      }

      this.closeModal();
      this.showFeedback(
        this.editingId ? "La categoría se actualizó correctamente." : "La categoría se creó correctamente.",
        "success",
      );
    }

    /**
     * Configura el diálogo reutilizable y solicita una eliminación segura solo al confirmar.
     *
     * @param {CalendarCategory} category Categoría seleccionada.
     * @param {HTMLButtonElement} trigger Control que abrió la confirmación.
     * @returns {void}
     */
    requestDelete(category, trigger) {
      this.confirmationDialog.open({
        confirmLabel: "Eliminar",
        message: `¿Estás seguro de que deseas eliminar la categoría "${category.name}"?`,
        onConfirm: () => {
          const result = this.onDeleteCategory(category.id);
          this.showFeedback(
            result.ok ? "La categoría se eliminó correctamente." : result.error,
            result.ok ? "success" : "error",
          );
          return result;
        },
        title: "Eliminar categoría",
        trigger,
      });
    }

    /**
     * @param {string} message Mensaje para la persona usuaria.
     * @param {"success"|"error"} type Tipo visual.
     * @returns {void}
     */
    showFeedback(message, type) {
      this.feedback.textContent = message || "No fue posible completar la acción.";
      this.feedback.className = `settings-feedback settings-feedback--${type}`;
      this.feedback.hidden = false;
    }
  }

  global.CalendarApp = {
    ...global.CalendarApp,
    SettingsView,
  };
}(window));
