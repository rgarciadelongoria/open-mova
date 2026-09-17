import type { Command } from 'commander';
import {
  readApplicationConfigurationDocument,
  requireApplicationRoot,
} from '../application/configuration.js';
import { terminal } from '../ui/terminal.js';

export function registerConfigCommand(program: Command): void {
  const config = program
    .command('config')
    .description('Consulta y valida mova.config.json sin editar archivos TypeScript');

  config.action(() => printConfiguration());

  config
    .command('show')
    .description('Muestra la configuración efectiva de la aplicación')
    .action(() => printConfiguration());

  config
    .command('validate')
    .description('Valida la configuración efectiva de la aplicación')
    .action(() => {
      const document = readDocument();
      terminal.success(
        `mova.config.json es válido para el esquema ${document.configuration.schemaVersion}.`,
      );

      if (document.migrations.length > 0) {
        terminal.section('Migraciones pendientes');
        for (const migration of document.migrations) terminal.item(migration);
      }
    });
}

function printConfiguration(): void {
  const document = readDocument();
  console.log(JSON.stringify(document.configuration, null, 2));

  if (document.migrations.length > 0) {
    console.error('\nMigraciones pendientes:');
    for (const migration of document.migrations) console.error(`- ${migration}`);
  }
}

function readDocument() {
  return readApplicationConfigurationDocument(requireApplicationRoot(process.cwd()));
}
