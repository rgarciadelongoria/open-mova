#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import { registerBuildCommand } from './commands/build.js';
import { registerCapacitorCommands } from './commands/capacitor.js';
import { registerCreateCommand } from './commands/create.js';
import { registerDoctorCommand } from './commands/doctor.js';
import { registerInfoCommand } from './commands/info.js';
import { registerMicrofrontendCommands } from './commands/microfrontend.js';
import { registerStartCommand } from './commands/start.js';
import { registerShellCommands } from './commands/shell.js';
import { registerUpdateCommand } from './commands/update.js';

const program = new Command();
const packageVersion = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string };

program
  .name('mova')
  .description('Herramientas de desarrollo para aplicaciones Open Mova')
  .version(packageVersion.version);

registerCreateCommand(program);
registerDoctorCommand(program);
registerMicrofrontendCommands(program);
registerStartCommand(program);
registerShellCommands(program);
registerBuildCommand(program);
registerCapacitorCommands(program);
registerInfoCommand(program);
registerUpdateCommand(program);

try {
  await program.parseAsync();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Error inesperado.';

  console.error(`Error: ${message}`);
  process.exitCode = 1;
}
