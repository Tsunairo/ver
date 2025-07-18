#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const commands_1 = require("./commands");
const program = new commander_1.Command();
console.log('Init version...');
program
    .name('ver')
    .version('1.0.0')
    .description('Ver CLI for managing project versions');
program.command('bump')
    .description('Bump version')
    .option('--major', 'create major release')
    .option('--minor', 'create minor release')
    .option('--patch', 'create patch release')
    .option('--pre-release', 'create pre release')
    .action((options) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, commands_1.bump)(Object.keys(options)[0].toUpperCase());
}));
program.command('init')
    .description('Initialize the project')
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, commands_1.init)();
}));
program.parse(process.argv);
/*
To run the "init" command from the terminal, use:
  node /workspaces/ver/bin/cli.mjs init

Or, if you have made the file executable (with chmod +x /workspaces/ver/bin/cli.mjs), you can run:
  ./bin/cli.mjs init
*/ 
