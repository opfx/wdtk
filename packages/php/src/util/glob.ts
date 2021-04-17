import * as glob from 'glob';

export async function globAsync(pattern: string, options: glob.IOptions) {
  return new Promise<string[]>((resolve, reject) => glob(pattern, options, (e, m) => (e ? reject(e) : resolve(m))));
}
