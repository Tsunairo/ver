#!/usr/bin/env node

import { Command } from 'commander';
import { init, bump } from './commands'; 

const program = new Command();

console.log('Init version...');
program
  .name('ver')
  .version('1.0.0')
  .description('Ver CLI for managing project versions');

program.command('bump')
  .description('Bump version')
  .action(async () => {
    console.log('Bumping version...');
    await bump();
  });

  program.command('init')
  .description('Initialize the project')
  .action(async () => {

    await init();
  });

program.parse(process.argv);
/*
To run the "init" command from the terminal, use:
  node /workspaces/ver/bin/cli.mjs init

Or, if you have made the file executable (with chmod +x /workspaces/ver/bin/cli.mjs), you can run:
  ./bin/cli.mjs init
*/