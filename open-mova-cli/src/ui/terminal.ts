import { createInterface } from 'node:readline/promises';

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'muted';

const ANSI: Readonly<Record<Tone | 'bold', [number, number]>> = {
  accent: [36, 39],
  success: [32, 39],
  warning: [33, 39],
  danger: [31, 39],
  muted: [2, 22],
  bold: [1, 22],
};

function useColor(): boolean {
  return Boolean(process.stdout.isTTY && !process.env.NO_COLOR && process.env.TERM !== 'dumb');
}

function style(value: string, tone: Tone | 'bold'): string {
  if (!useColor()) return value;
  const [open, close] = ANSI[tone];
  return `\u001B[${open}m${value}\u001B[${close}m`;
}

function writeStatus(symbol: string, tone: Tone, message: string): void {
  console.log(`${style(symbol, tone)} ${message}`);
}

export const terminal = {
  heading(title: string, detail?: string): void {
    console.log();
    console.log(`${style('Open Mova', 'accent')} ${style(title, 'bold')}`);
    if (detail) console.log(style(detail, 'muted'));
  },

  section(title: string): void {
    console.log(`\n${style(title, 'bold')}`);
  },

  info(message: string): void {
    writeStatus('●', 'accent', message);
  },

  success(message: string): void {
    writeStatus('✓', 'success', message);
  },

  warning(message: string): void {
    writeStatus('▲', 'warning', message);
  },

  error(message: string): void {
    console.error(`${style('✕', 'danger')} ${message}`);
  },

  item(message: string, tone: Tone = 'muted'): void {
    console.log(`${style('›', tone)} ${message}`);
  },

  keyValue(label: string, value: string): void {
    console.log(`${style(`${label}:`, 'muted')} ${value}`);
  },

  command(command: string): void {
    console.log(`  ${style('$', 'accent')} ${command}`);
  },
};

/**
 * Pide una confirmación segura para operaciones que modifican la aplicación.
 * En un proceso no interactivo se exige el indicador --yes del comando.
 */
export async function confirm(message: string): Promise<boolean> {
  if (!process.stdin.isTTY) return false;

  const input = createInterface({ input: process.stdin, output: process.stdout });

  try {
    const answer = await input.question(`${message} [y/N] `);
    return ['y', 'yes', 's', 'si', 'sí'].includes(answer.trim().toLowerCase());
  } finally {
    input.close();
  }
}
