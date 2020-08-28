export function stripIndents(strings: TemplateStringsArray, ...values: any[]) {
  return String.raw(strings, ...values)
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
}
