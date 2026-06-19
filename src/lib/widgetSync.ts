/**
 * Pushes the current D-Day data into native storage so an Android home-screen
 * widget can read it.
 *
 * On the plain web this is a no-op. Inside the Capacitor WebView wrapper the
 * `@capacitor/preferences` plugin is present on `window.Capacitor.Plugins`,
 * and writes to Android `SharedPreferences` (file: "CapacitorStorage"), which
 * the widget's AppWidgetProvider reads. We access it dynamically so the web
 * bundle carries no Capacitor dependency.
 */

interface PreferencesPlugin {
  set(options: { key: string; value: string }): Promise<void>;
}

interface CapacitorWindow {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    Plugins?: { Preferences?: PreferencesPlugin };
  };
}

export const WIDGET_PREF_KEY = "dday";

export async function syncDdayToWidget(startDate: string, dayCount: number) {
  if (typeof window === "undefined") return;
  const cap = (window as unknown as CapacitorWindow).Capacitor;
  const prefs = cap?.Plugins?.Preferences;
  if (!cap?.isNativePlatform?.() || !prefs) return;

  try {
    await prefs.set({
      key: WIDGET_PREF_KEY,
      value: JSON.stringify({ startDate, dayCount, updatedAt: Date.now() }),
    });
  } catch {
    // Non-fatal: the widget simply keeps its previous value.
  }
}
