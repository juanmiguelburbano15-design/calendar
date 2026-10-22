/**
 * Componente reutilizable para confirmar acciones destructivas.
 */
(function initializeConfirmationDialog(global) {
  const FOCUSABLE_SELECTOR = [
    "button:not([disabled])",
    "[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");

  /** Gestiona contenido, foco y resultado de una confirmación modal. */
  class ConfirmationDialog {
    /**
     * @param {Object} options Dependencias del componente.
     * @param {HTMLElement} options.root Contenedor que cubre la ventana.
     * @param {HTMLElement} [options.fallbackFocus] Control alternativo para restaurar el foco.
     */
    constructor({ root, fallbackFocus = null }) {
      this.root = root;
      this.fallbackFocus = fallbackFocus;
      this.dialog = root.querySelector(".confirmation-dialog");
      this.title = root.querySelector("#confirmation-title");
      this.message = root.querySelector("#confirmation-message");
      this.description = root.querySelector("#confirmation-description");
      this.error = root.querySelector("#confirmation-error");
      this.closeButton = root.querySelector("#confirmation-close");
      this.cancelButton = root.querySelector("#confirmation-cancel");
      this.confirmButton = root.querySelector("#confirmation-accept");
      this.confirmLabel = root.querySelector("#confirmation-label");
      this.backdrop = root.querySelector("[data-confirmation-cancel]");
      this.onConfirm = null;
      this.returnFocus = null;
      this.closeTimer = null;
      this.isPending = false;
      this.bindEvents();
    }

    /** Registra los controles del componente una sola vez. @returns {void} */
    bindEvents() {
      this.cancelButton.addEventListener("click", () => this.cancel());
      this.closeButton.addEventListener("click", () => this.cancel());
      this.backdrop.addEventListener("click", () => this.cancel());
      this.confirmButton.addEventListener("click", () => this.handleConfirm());
      this.root.addEventListener("keydown", (event) => this.handleKeydown(event));
    }

    /**
     * Abre una confirmación con contenido y acción configurables.
     * La acción puede devolver un resultado síncrono o una promesa con `{ok, error}`.
     *
     * @param {Object} options Configuración de la confirmación.
     * @param {string} options.title Título visible y accesible.
     * @param {string} options.message Pregunta principal.
     * @param {string} [options.description="Esta acción no se puede deshacer."] Advertencia secundaria.
     * @param {string} [options.confirmLabel="Confirmar"] Etiqueta de la acción destructiva.
     * @param {() => ({ok: boolean, error?: string}|Promise<{ok: boolean, error?: string}>)} options.onConfirm Acción diferida hasta confirmar.
     * @param {HTMLElement} [options.trigger=document.activeElement] Elemento que recuperará el foco.
     * @returns {void}
     */
    open({
      title,
      message,
      description = "Esta acción no se puede deshacer.",
      confirmLabel = "Confirmar",
      onConfirm,
      trigger = global.document.activeElement,
    }) {
      if (typeof onConfirm !== "function") {
        throw new TypeError("La confirmación requiere una acción válida.");
      }

      if (this.closeTimer !== null) {
        global.clearTimeout(this.closeTimer);
        this.closeTimer = null;
      }

      this.returnFocus = trigger;
      this.onConfirm = onConfirm;
      this.title.textContent = title;
      this.message.textContent = message;
      this.description.textContent = description;
      this.confirmLabel.textContent = confirmLabel;
      this.hideError();
      this.setPending(false);
      this.root.hidden = false;
      this.root.classList.remove("confirmation-modal--closing");
      global.document.body.classList.add("modal-open");

      global.requestAnimationFrame(() => {
        this.root.classList.add("confirmation-modal--visible");
        this.cancelButton.focus();
      });
    }

    /** Cancela sin ejecutar la acción configurada. @returns {void} */
    cancel() {
      if (!this.isPending) {
        this.close();
      }
    }

    /**
     * Ejecuta la acción configurada y mantiene el modal abierto si falla.
     *
     * @returns {Promise<void>}
     */
    async handleConfirm() {
      if (this.isPending || typeof this.onConfirm !== "function") {
        return;
      }

      this.hideError();
      this.setPending(true);

      try {
        const result = await this.onConfirm();
        if (result && result.ok === false) {
          this.showError(result.error);
          this.setPending(false);
          this.confirmButton.focus();
          return;
        }

        this.setPending(false);
        this.close();
      } catch (error) {
        this.showError("No fue posible completar la acción. Inténtalo nuevamente.");
        this.setPending(false);
        this.confirmButton.focus();
      }
    }

    /**
     * Cierra con una transición breve y restaura el foco de forma segura.
     *
     * @returns {void}
     */
    close() {
      if (this.root.hidden || this.root.classList.contains("confirmation-modal--closing")) {
        return;
      }

      this.root.classList.remove("confirmation-modal--visible");
      this.root.classList.add("confirmation-modal--closing");

      const finishClose = () => {
        this.root.hidden = true;
        this.root.classList.remove("confirmation-modal--closing");
        this.onConfirm = null;
        this.closeTimer = null;

        const openModal = global.document.querySelector(".modal:not([hidden]), .confirmation-modal:not([hidden])");
        if (!openModal) {
          global.document.body.classList.remove("modal-open");
        }

        const focusTarget = this.returnFocus && this.returnFocus.isConnected
          ? this.returnFocus
          : this.fallbackFocus;
        if (focusTarget && typeof focusTarget.focus === "function") {
          focusTarget.focus();
        }
      };

      if (global.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        finishClose();
        return;
      }

      this.closeTimer = global.setTimeout(finishClose, 180);
    }

    /**
     * Cierra con Escape y mantiene la navegación Tab dentro del diálogo.
     *
     * @param {KeyboardEvent} event Evento de teclado del modal.
     * @returns {void}
     */
    handleKeydown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        this.cancel();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = [...this.dialog.querySelectorAll(FOCUSABLE_SELECTOR)]
        .filter((element) => !element.hidden);
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && global.document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && global.document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    /** @param {boolean} isPending Indica si la acción está en ejecución. @returns {void} */
    setPending(isPending) {
      this.isPending = isPending;
      this.confirmButton.disabled = isPending;
      this.cancelButton.disabled = isPending;
      this.closeButton.disabled = isPending;
      this.root.toggleAttribute("aria-busy", isPending);
    }

    /** @param {string} message Mensaje visible y anunciado. @returns {void} */
    showError(message) {
      this.error.textContent = message || "No fue posible completar la acción.";
      this.error.hidden = false;
    }

    /** Limpia el error de una confirmación anterior. @returns {void} */
    hideError() {
      this.error.textContent = "";
      this.error.hidden = true;
    }
  }

  global.CalendarApp = {
    ...global.CalendarApp,
    ConfirmationDialog,
  };
}(window));
