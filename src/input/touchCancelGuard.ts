/**
 * Phaser calls `preventDefault()` on every `touchcancel`, but browsers fire
 * that event as non-cancelable. Chrome then logs a console error
 * ("Ignored attempt to cancel a touchcancel event with cancelable=false"),
 * which on Android would show up whenever a system gesture interrupts a touch.
 *
 * Phaser's touch capture must stay ON: it is what stops the browser from also
 * sending emulated mouse events after a tap (which would double every
 * pointerdown). So instead of disabling capture, neutralise `preventDefault`
 * only for non-cancelable touchcancel events, before Phaser's handler runs.
 */
export function guardNonCancelableTouchCancel(target: HTMLElement): void {
  target.addEventListener(
    'touchcancel',
    (event: TouchEvent) => {
      if (!event.cancelable) {
        event.preventDefault = (): void => undefined;
      }
    },
    { capture: true },
  );
}
