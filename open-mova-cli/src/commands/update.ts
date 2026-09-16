import type { Command } from 'commander';
import {
  readApplicationConfigurationDocument,
  requireApplicationRoot,
} from '../application/configuration.js';
import { applyShellUpdate, createShellUpdatePlan } from '../application/shell-update.js';

interface UpdateCommandOptions {
  readonly check?: boolean;
  readonly to?: string;
}

export function registerUpdateCommand(program: Command): void {
  program
    .command('update')
    .description('Actualiza la infraestructura de Open Mova de una aplicación')
    .option('--check', 'mostrar los cambios sin modificar archivos')
    .option('--to <tag>', 'versión de destino, por ejemplo v0.2.0')
    .action((options: UpdateCommandOptions) => {
      const applicationRoot = requireApplicationRoot(process.cwd());
      const document = readApplicationConfigurationDocument(applicationRoot);
      const configuration = document.configuration;
      const plan = createShellUpdatePlan(applicationRoot, configuration, options.to);

      printPlan(plan);
      if (document.migrations.length > 0) {
        console.log('Migraciones de mova.config.json:');
        for (const migration of document.migrations) console.log(`- ${migration}`);
      }
      if (options.check) return;

      if (plan.conflicts.length > 0) {
        throw new Error(
          'Se han detectado archivos modificados. Resuelve los conflictos antes de actualizar.',
        );
      }
      if (plan.changes.length === 0 && document.migrations.length === 0) {
        console.log('La aplicación ya está actualizada.');
        return;
      }

      applyShellUpdate(applicationRoot, configuration, plan);
      console.log(`Aplicación actualizada a ${plan.target.version}.`);
      if (document.migrations.length > 0) {
        console.log('mova.config.json se ha migrado al esquema actual.');
      }
      if (plan.removePackageLock) {
        console.log(
          'Ejecuta npm install para instalar dependencias y regenerar package-lock.json.',
        );
      }
      console.log('Después ejecuta mova build para verificar la aplicación.');
    });
}

function printPlan(plan: ReturnType<typeof createShellUpdatePlan>): void {
  console.log(`Shell actual: ${plan.currentVersion}`);
  console.log(`Shell destino: ${plan.target.version}`);

  if (plan.changes.length > 0) {
    console.log('Cambios:');
    for (const change of plan.changes) console.log(`- ${change}`);
  }
  if (plan.conflicts.length > 0) {
    console.log('Conflictos que no se sobrescribirán:');
    for (const conflict of plan.conflicts) console.log(`- ${conflict}`);
  }
}
