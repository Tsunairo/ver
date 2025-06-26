#!/usr/bin/env zx

import { Command } from 'commander';
import init from './commands/init';
import bump from './commands/bump';

const program = new Command();

program
  .name('ver')
  .version('1.0.0')
  .description('Ver CLI for managing project versions');

program.command('init')
  .description('Initialize the project')
  .action(async () => {
    await init();
  });

program.command('bump')
  .description('Bump version')
  .action(async () => {
    await bump();
  });

program.parse(process.argv);
/*
To run the "init" command from the terminal, use:
  node /workspaces/ver/bin/cli.mjs init

Or, if you have made the file executable (with chmod +x /workspaces/ver/bin/cli.mjs), you can run:
  ./bin/cli.mjs init
*/