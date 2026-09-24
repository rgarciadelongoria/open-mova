import type { Command } from 'commander';
import {
  inspectDevelopmentEnvironment,
  type DoctorCheckStatus,
  type DoctorPlatform,
} from '../application/doctor.js';
import { terminal } from '../ui/terminal.js';

export function registerDoctorCommand(program: Command): void {
  program
    .command('doctor [platform]')
    .description('Comprueba el entorno y la configuración de una aplicación Open Mova')
    .action((platform?: string) => {
      const report = inspectDevelopmentEnvironment(process.cwd(), {
        ...(platform ? { platform: parsePlatform(platform) } : {}),
      });

      terminal.heading(
        'Diagnóstico',
        `Comprobación del entorno y de la aplicación actual${platform ? ` para ${platform}` : ''}.`,
      );
      for (const check of report.checks) {
        printCheck(check.status, check.message);
        if (check.detail) terminal.item(check.detail);
      }

      const errors = report.checks.filter((check) => check.status === 'error').length;
      const warnings = report.checks.filter((check) => check.status === 'warning').length;
      terminal.section('Resultado');
      if (errors > 0) terminal.error(`${errors} errores, ${warnings} avisos.`);
      else if (warnings > 0) terminal.warning(`${errors} errores, ${warnings} avisos.`);
      else terminal.success('Sin errores ni avisos.');

      if (errors > 0) process.exitCode = 1;
    });
}

function parsePlatform(value: string): DoctorPlatform {
  if (value === 'android' || value === 'ios') return value;
  throw new Error('La plataforma debe ser android o ios.');
}

function printCheck(status: DoctorCheckStatus, message: string): void {
  if (status === 'ok') terminal.success(message);
  else if (status === 'warning') terminal.warning(message);
  else terminal.error(message);
}
