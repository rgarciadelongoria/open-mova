import type { Command } from 'commander';
import {
  readApplicationConfigurationDocument,
  requireApplicationRoot,
} from '../application/configuration.js';
import { applyShellUpdate, createShellUpdatePlan } from '../application/shell-update.js';
import { confirm, terminal } from '../ui/terminal.js';

interface UpdateCommandOptions {
  readonly check?: boolean;
  readonly to?: string;
  readonly yes?: boolean;
}

export function registerUpdateCommand(program: Command): void {
  program
    .command('update')
    .description('Actualiza la infraestructura de Open Mova de una aplicación')
    .option('--check', 'mostrar los cambios sin modificar archivos')
    .option('--to <tag>', 'versión de destino, por ejemplo v0.2.0')
    .option('-y, --yes', 'confirmar la actualización sin interacción')
    .action(async (options: UpdateCommandOptions) => {
      const applicationRoot = requireApplicationRoot(process.cwd());
      const document = readApplicationConfigurationDocument(applicationRoot);
      const configuration = document.configuration;
      const plan = createShellUpdatePlan(applicationRoot, configuration, options.to);

      printPlan(plan);
      if (document.migrations.length > 0) {
        terminal.section('Migraciones de mova.config.json');
        for (const migration of document.migrations) terminal.item(migration);
      }
      if (options.check) return;

      if (plan.conflicts.length > 0) {
        throw new Error(
          'Se han detectado archivos modificados. Resuelve los conflictos antes de actualizar.',
        );
      }
      if (plan.changes.length === 0 && document.migrations.length === 0) {
        terminal.success('La aplicación ya está actualizada.');
        return;
      }

      terminal.section('Antes de actualizar');
      terminal.warning(
        'Guarda el estado actual en un commit o una rama segura de Git antes de continuar.',
      );
      terminal.item('La actualización modificará únicamente la infraestructura gestionada.');
      terminal.item('Los conflictos detectados no se sobrescriben automáticamente.');

      if (!options.yes) {
        const confirmed = await confirm('¿Quieres aplicar esta actualización?');
        if (!confirmed) {
          terminal.warning(
            'Actualización cancelada. Usa --yes solo en automatizaciones controladas.',
          );
          return;
        }
      }

      applyShellUpdate(applicationRoot, configuration, plan);
      terminal.success(`Aplicación actualizada a ${plan.target.version}.`);
      if (document.migrations.length > 0) {
        terminal.info('mova.config.json se ha migrado al esquema actual.');
      }
      if (plan.removePackageLock) {
        terminal.warning(
          'Ejecuta npm install para instalar dependencias y regenerar package-lock.json.',
        );
      }
      terminal.info('Después ejecuta mova build para verificar la aplicación.');
    });
}

function printPlan(plan: ReturnType<typeof createShellUpdatePlan>): void {
  terminal.heading(
    'Actualización de aplicación',
    'Revisión de cambios antes de modificar archivos.',
  );
  terminal.keyValue('Shell actual', plan.currentVersion);
  terminal.keyValue('Shell destino', plan.target.version);

  if (plan.changes.length > 0) {
    terminal.section('Cambios propuestos');
    for (const change of plan.changes) terminal.item(change, 'accent');
  }
  if (plan.conflicts.length > 0) {
    terminal.section('Conflictos que no se sobrescribirán');
    for (const conflict of plan.conflicts) terminal.item(conflict, 'warning');
  }
}
