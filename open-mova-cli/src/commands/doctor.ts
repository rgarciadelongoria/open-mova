import type { Command } from 'commander';
import { inspectDevelopmentEnvironment, type DoctorCheckStatus } from '../application/doctor.js';

const STATUS_SYMBOL: Readonly<Record<DoctorCheckStatus, string>> = {
  ok: '✓',
  warning: '!',
  error: '✗',
};

export function registerDoctorCommand(program: Command): void {
  program
    .command('doctor')
    .description('Comprueba el entorno y la configuración de una aplicación Open Mova')
    .action(() => {
      const report = inspectDevelopmentEnvironment(process.cwd());

      console.log('Diagnóstico de Open Mova');
      for (const check of report.checks) {
        console.log(`${STATUS_SYMBOL[check.status]} ${check.message}`);
        if (check.detail) console.log(`  ${check.detail}`);
      }

      const errors = report.checks.filter((check) => check.status === 'error').length;
      const warnings = report.checks.filter((check) => check.status === 'warning').length;
      console.log(`Resultado: ${errors} errores, ${warnings} avisos.`);

      if (errors > 0) process.exitCode = 1;
    });
}
