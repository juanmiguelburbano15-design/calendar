/**
 * Persistencia defensiva de las preferencias visuales del calendario.
 */
(function initializeSettingsStorage(global) {
  const STORAGE_KEY = "calendario_configuracion";
  const DEFAULT_SETTINGS = Object.freeze({
    firstDayOfWeek: "monday",
    theme: "light",
  });
  const SUPPORTED_THEMES = Object.freeze([
    "light",
    "dark",
    "midnight",
    "forest",
    "lavender",
    "sakura",
    "sand",
    "graphite",
  ]);

  /**
   * Normaliza las preferencias y conserva solamente valores soportados.
   *
   * @param {unknown} value Preferencias obtenidas del almacenamiento.
   * @returns {{firstDayOfWeek: "monday"|"sunday", theme: string}}
   */
  function normalizeSettings(value) {
    const storedSettings = value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};

    return {
      firstDayOfWeek: storedSettings.firstDayOfWeek === "sunday" ? "sunday" : "monday",
      theme: SUPPORTED_THEMES.includes(storedSettings.theme) ? storedSettings.theme : "light",
    };
  }

  /**
   * Lee las preferencias sin modificar datos existentes ni propagar errores.
   *
   * @returns {{firstDayOfWeek: "monday"|"sunday", theme: string}}
   */
  function readSettings() {
    try {
      const storedValue = global.localStorage.getItem(STORAGE_KEY);
      return storedValue ? normalizeSettings(JSON.parse(storedValue)) : { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Guarda una copia normalizada de las preferencias.
   *
   * @param {unknown} settings Preferencias que se desean persistir.
   * @returns {boolean} `true` si el navegador completó la escritura.
   */
  function writeSettings(settings) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeSettings(settings)));
      return true;
    } catch {
      return false;
    }
  }

  global.CalendarApp = {
    ...global.CalendarApp,
    settingsStorage: Object.freeze({
      DEFAULT_SETTINGS,
      STORAGE_KEY,
      SUPPORTED_THEMES,
      normalizeSettings,
      readSettings,
      writeSettings,
    }),
  };
}(window));
