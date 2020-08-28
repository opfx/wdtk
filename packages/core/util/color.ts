import * as ansiColors from 'ansi-colors';
import { WriteStream } from 'tty';

export const supportsColor =
  process.stdout instanceof WriteStream &&
  ((process.stdout as unknown) as { getColorDepth(): number }).getColorDepth() > 1;

export function removeColor(text: string): string {
  return text.replace(new RegExp(ansiColors.ansiRegex), '');
}

// tslint:disable-next-line: no-any
const colors = (ansiColors as any).create() as typeof ansiColors;
colors.enabled = supportsColor;

export { colors };
