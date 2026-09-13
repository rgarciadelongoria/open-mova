#!/usr/bin/env node

import { Command } from 'commander';
import { registerInfoCommand } from './commands/info.js';

const program = new Command();

program
  .name('mova')
  .description('Herramientas de desarrollo para aplicaciones Open Mova')
  .version('0.1.0');

registerInfoCommand(program);

await program.parseAsync();
