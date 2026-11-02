// Where the user is in a tutorial. Kept for the tab (`sessionStorage`) so it carries on
// across page changes and a reload; the tour component reads it with useSyncExternalStore.

const KEY = "tajlandia_tutorial";
const CHANGED_EVENT = "tajlandia:tutorial-changed";
// Storage can be blocked (private windows): progress then lasts until reload.
let memoryValue: string | null = null;

export type TutorialProgress = { id: string; step: number };

function write(value: string | null) {
  memoryValue = value;
  try {
    if (value === null) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, value);
  } catch {
    // Not saved; the in-memory value still works until reload.
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function startTutorial(id: string) {
  write(JSON.stringify({ id, step: 0 } satisfies TutorialProgress));
}

export function setTutorialStep(id: string, step: number) {
  write(JSON.stringify({ id, step } satisfies TutorialProgress));
}

export function stopTutorial() {
  write(null);
}

/** The raw saved value (a string, so useSyncExternalStore can compare snapshots). */
export function getTutorialSnapshot(): string | null {
  try {
    return sessionStorage.getItem(KEY) ?? memoryValue;
  } catch {
    return memoryValue;
  }
}

export function subscribeTutorial(onChange: () => void) {
  window.addEventListener(CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function parseTutorialProgress(raw: string | null): TutorialProgress | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<TutorialProgress> | null;
    if (value && typeof value.id === "string" && Number.isInteger(value.step) && (value.step as number) >= 0) {
      return { id: value.id, step: value.step as number };
    }
  } catch {
    // Fall through: not a saved tutorial.
  }
  return null;
}
