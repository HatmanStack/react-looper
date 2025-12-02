/**
 * Web-compatible Alert implementation
 *
 * Provides browser-compatible alerts for web platform.
 */

interface AlertButton {
  text?: string;
  onPress?: () => void;
}

export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]): void {
    const fullMessage = message ? `${title}\n\n${message}` : title;

    if (buttons && buttons.length > 0) {
      // If there are buttons with handlers, just use first button for now
      const result = window.confirm(fullMessage);
      if (result && buttons[0].onPress) {
        buttons[0].onPress();
      }
    } else {
      window.alert(fullMessage);
    }
  },
};
