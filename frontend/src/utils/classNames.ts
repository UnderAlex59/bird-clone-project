// Utility to join conditional class names safely.
export const classNames = (...classes: Array<string | boolean | null | undefined>) =>
  classes.filter(Boolean).join(' ')
