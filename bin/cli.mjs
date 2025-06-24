#!/usr/bin/env node
import { Command } from 'commander';
import init from '../commands/init';
import bump from '../commands/core';

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
