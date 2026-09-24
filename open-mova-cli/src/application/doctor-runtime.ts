import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

export interface DoctorCommandResult {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly error?: string;
}

/** Dependencias del sistema aisladas para que los detectores sean comprobables. */
export interface DoctorRuntime {
  readonly platform: NodeJS.Platform;
  readonly nodeVersion: string;
  readonly environment: NodeJS.ProcessEnv;
  command(command: string, args: readonly string[], shell?: boolean): DoctorCommandResult;
  fileExists(path: string): boolean;
  readFile(path: string): string;
}

export function createSystemDoctorRuntime(): DoctorRuntime {
  return {
    platform: process.platform,
    nodeVersion: process.versions.node,
    environment: process.env,
    command(command, args, shell = false): DoctorCommandResult {
      const result = spawnSync(command, [...args], { encoding: 'utf8', shell });
      return {
        status: result.status,
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
        ...(result.error ? { error: result.error.message } : {}),
      };
    },
    fileExists: existsSync,
    readFile(path): string {
      return readFileSync(path, 'utf8');
    },
  };
}
