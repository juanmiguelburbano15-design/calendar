/**
 * Fuente única de categorías, validación y persistencia local.
 */
(function initializeCategoryStorage(global) {
  const STORAGE_KEY = "calendario_categorias";
  const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
  const DEFAULT_DEFINITIONS = Object.freeze([
    Object.freeze({ id: "universidad", name: "Universidad", token: "--category-university" }),
    Object.freeze({ id: "trabajo", name: "Trabajo", token: "--category-work" }),
    Object.freeze({ id: "personal", name: "Personal", token: "--category-personal" }),
    Object.freeze({ id: "salud", name: "Salud", token: "--category-health" }),
    Object.freeze({ id: "otros", name: "Otros", token: "--category-other" }),
  ]);

  /**
   * @typedef {Object} CalendarCategory
   * @property {string} id Identificador estable.
   * @property {string} name Nombre visible actual.
   * @property {string} color Color hexadecimal.
   * @property {string[]} aliases Nombres anteriores para eventos heredados.
   */

  /** @param {unknown} value @returns {string} Texto comparable sin tildes ni espacios extremos. */
  function normalizeName(value) {
    return String(value || "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es");
  }

  /**
   * Lee un color oficial desde `variables.css`.
   *
   * @param {string} token Nombre de la variable CSS.
   * @returns {string} Color hexadecimal normalizado.
   */
  function readCssColor(token) {
    const value = global.getComputedStyle(global.document.documentElement)
      .getPropertyValue(token)
      .trim();

    const fallback = global.getComputedStyle(global.document.documentElement)
      .getPropertyValue("--color-text-secondary")
      .trim();

    return (HEX_COLOR_PATTERN.test(value) ? value : fallback).toUpperCase();
  }

  /** @returns {CalendarCategory[]} Cinco categorías iniciales basadas en los tokens oficiales. */
  function getDefaultCategories() {
    return DEFAULT_DEFINITIONS.map(({ id, name, token }) => ({
      aliases: [],
      color: readCssColor(token),
      id,
      name,
    }));
  }

  /**
   * Valida y normaliza una categoría almacenada.
   *
   * @param {unknown} value Registro que se desea validar.
   * @returns {CalendarCategory|null} Categoría utilizable o `null`.
   */
  function normalizeCategoryRecord(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }

    const id = typeof value.id === "string" ? value.id.trim() : "";
    const name = typeof value.name === "string" ? value.name.trim() : "";
    const color = typeof value.color === "string" ? value.color.trim().toUpperCase() : "";
    if (!id || !name || !HEX_COLOR_PATTERN.test(color)) {
      return null;
    }

    const aliases = Array.isArray(value.aliases)
      ? [...new Set(value.aliases.filter((alias) => typeof alias === "string")
        .map((alias) => alias.trim()).filter(Boolean))]
      : [];

    return { aliases, color, id, name };
  }

  /**
   * Lee categorías válidas; usa los valores oficiales si faltan o son inválidas.
   * La lectura no escribe automáticamente para no reemplazar datos innecesariamente.
   *
   * @returns {CalendarCategory[]}
   */
  function readCategories() {
    try {
      const storedValue = global.localStorage.getItem(STORAGE_KEY);
      if (!storedValue) {
        return getDefaultCategories();
      }

      const parsedValue = JSON.parse(storedValue);
      if (!Array.isArray(parsedValue)) {
        return getDefaultCategories();
      }

      const categories = parsedValue.map(normalizeCategoryRecord).filter(Boolean);
      const uniqueIds = new Set(categories.map((category) => category.id));
      const uniqueNames = new Set(categories.map((category) => normalizeName(category.name)));
      return categories.length === parsedValue.length
        && uniqueIds.size === categories.length
        && uniqueNames.size === categories.length
        ? categories
        : getDefaultCategories();
    } catch {
      return getDefaultCategories();
    }
  }

  /**
   * @param {CalendarCategory[]} categories Categorías que se desean guardar.
   * @returns {boolean} `true` cuando la escritura finaliza correctamente.
   */
  function writeCategories(categories) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Valida los campos del formulario y evita nombres repetidos.
   *
   * @param {{name?: string, color?: string}} input Valores del formulario.
   * @param {CalendarCategory[]} categories Categorías actuales.
   * @param {string} [excludedId] Categoría ignorada durante una edición.
   * @returns {{valid: boolean, error: string, value?: {name: string, color: string}}}
   */
  function validateCategoryInput(input, categories, excludedId) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    const color = typeof input.color === "string" ? input.color.trim().toUpperCase() : "";

    if (!name) {
      return { error: "Escribe un nombre para la categoría.", valid: false };
    }
    if (categories.some((category) => (
      category.id !== excludedId
      && [category.name, ...category.aliases].some((candidate) => (
        normalizeName(candidate) === normalizeName(name)
      ))
    ))) {
      return { error: "Ya existe una categoría con ese nombre.", valid: false };
    }
    if (!HEX_COLOR_PATTERN.test(color)) {
      return { error: "Selecciona un color válido.", valid: false };
    }

    return { error: "", valid: true, value: { color, name } };
  }

  /** @returns {string} Identificador suficientemente estable para datos locales. */
  function createCategoryId() {
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      return `categoria-${global.crypto.randomUUID()}`;
    }

    return `categoria-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  /**
   * Crea una categoría sin mutar la colección original.
   *
   * @param {CalendarCategory[]} categories Categorías actuales.
   * @param {{name?: string, color?: string}} input Valores nuevos.
   * @returns {{ok: boolean, categories?: CalendarCategory[], error?: string}}
   */
  function createCategory(categories, input) {
    const validation = validateCategoryInput(input, categories);
    if (!validation.valid) {
      return { error: validation.error, ok: false };
    }

    return {
      categories: [...categories, {
        aliases: [],
        id: createCategoryId(),
        ...validation.value,
      }],
      ok: true,
    };
  }

  /**
   * Edita nombre y color conservando ID y nombres anteriores.
   *
   * @param {CalendarCategory[]} categories Categorías actuales.
   * @param {string} id Identificador estable.
   * @param {{name?: string, color?: string}} input Valores editados.
   * @returns {{ok: boolean, categories?: CalendarCategory[], error?: string}}
   */
  function updateCategory(categories, id, input) {
    const category = categories.find((item) => item.id === id);
    if (!category) {
      return { error: "La categoría ya no está disponible.", ok: false };
    }

    const validation = validateCategoryInput(input, categories, id);
    if (!validation.valid) {
      return { error: validation.error, ok: false };
    }

    const nameChanged = normalizeName(category.name) !== normalizeName(validation.value.name);
    const aliases = nameChanged
      ? [...new Set([...category.aliases, category.name])]
      : [...category.aliases];

    return {
      categories: categories.map((item) => item.id === id
        ? { ...item, ...validation.value, aliases }
        : item),
      ok: true,
    };
  }

  /**
   * Busca la categoría de un evento por ID y, para datos antiguos, por nombre o alias.
   *
   * @param {CalendarEvent} event Evento almacenado.
   * @param {CalendarCategory[]} categories Categorías actuales.
   * @returns {CalendarCategory|null}
   */
  function findCategoryForEvent(event, categories) {
    if (event.categoriaId) {
      const byId = categories.find((category) => category.id === event.categoriaId);
      if (byId) {
        return byId;
      }
    }

    const eventName = normalizeName(event.categoria);
    return categories.find((category) => (
      normalizeName(category.name) === eventName
      || category.aliases.some((alias) => normalizeName(alias) === eventName)
    )) || categories.find((category) => category.id === "otros") || null;
  }

  /**
   * @param {CalendarEvent[]} events Eventos actuales.
   * @param {CalendarCategory} category Categoría que se desea eliminar.
   * @returns {boolean} `true` si existe al menos un evento relacionado.
   */
  function categoryHasEvents(events, category) {
    const acceptedNames = new Set([category.name, ...category.aliases].map(normalizeName));
    return events.some((event) => (
      event.categoriaId === category.id || acceptedNames.has(normalizeName(event.categoria))
    ));
  }

  /**
   * Aplica color y fondo derivado a un elemento de evento.
   *
   * @param {HTMLElement} element Elemento que se desea colorear.
   * @param {CalendarCategory|null} category Categoría resuelta.
   * @param {boolean} [includeBackground=true] Indica si debe agregarse fondo suave.
   * @returns {void}
   */
  function applyCategoryColor(element, category, includeBackground = true) {
    if (!category) {
      return;
    }

    element.style.color = category.color;
    if (includeBackground) {
      element.style.backgroundColor = `${category.color}1A`;
    } else {
      element.style.backgroundColor = category.color;
    }
  }

  global.CalendarApp = {
    ...global.CalendarApp,
    categoryStorage: Object.freeze({
      STORAGE_KEY,
      applyCategoryColor,
      categoryHasEvents,
      createCategory,
      findCategoryForEvent,
      getDefaultCategories,
      normalizeName,
      readCategories,
      updateCategory,
      validateCategoryInput,
      writeCategories,
    }),
  };
}(window));
