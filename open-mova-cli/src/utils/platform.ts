export function npmCommand(): string {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

export function localBinaryName(name: string): string {
  return process.platform === 'win32' ? `${name}.cmd` : name;
}

export function useCommandShell(): boolean {
  return process.platform === 'win32';
}
