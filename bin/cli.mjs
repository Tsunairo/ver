#!/usr/bin/env node
import { Command } from 'commander';
import init from '../commands/init.mjs';
const program = new Command();

program
  .name('ver')
  .version('1.0.0')
  .description('Ver CLI for managing project versions');

program.command('init')
  .description('Initialize the project')
  .action(async () => {
    await init()
  });

program.parse(process.argv);
