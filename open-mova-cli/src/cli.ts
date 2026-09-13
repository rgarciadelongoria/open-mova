#!/usr/bin/env node

import { Command } from 'commander';
import { registerBuildCommand } from './commands/build.js';
import { registerCreateCommand } from './commands/create.js';
import { registerInfoCommand } from './commands/info.js';
import { registerMicrofrontendCommands } from './commands/microfrontend.js';
import { registerStartCommand } from './commands/start.js';

const program = new Command();

program
  .name('mova')
  .description('Herramientas de desarrollo para aplicaciones Open Mova')
  .version('0.1.0');

registerCreateCommand(program);
registerMicrofrontendCommands(program);
registerStartCommand(program);
registerBuildCommand(program);
registerInfoCommand(program);

try {
  await program.parseAsync();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Error inesperado.';

  console.error(`Error: ${message}`);
  process.exitCode = 1;
}
