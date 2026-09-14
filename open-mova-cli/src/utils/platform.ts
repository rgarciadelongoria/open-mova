export function npmCommand(): string {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

export function localBinaryName(name: string): string {
  return process.platform === 'win32' ? `${name}.cmd` : name;
}

export function useCommandShell(): boolean {
  return process.platform === 'win32';
}

/** Genera un comando copiable en PowerShell y en cmd, también con espacios. */
export function changeDirectoryCommand(directory: string): string {
  return `cd "${directory.replaceAll('\\', '/')}"`;
}
