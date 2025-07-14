#!/usr/bin/env zx
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
exports.prompt = exports.isPushSuccessful = exports.hasUncommittedChanges = exports.handleError = void 0;
const zx_1 = require("zx");
const prompts_1 = require("@inquirer/prompts");
const handleError = (error, context) => {
    console.error(zx_1.chalk.red(`Error in ${context}:`));
    console.error(zx_1.chalk.red(error.message));
    process.exit(1);
};
exports.handleError = handleError;
const hasUncommittedChanges = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check for staged and unstaged changes
        const { stdout: stagedChanges } = yield (0, zx_1.$) `git diff --cached --quiet || echo "staged"`;
        const { stdout: unstagedChanges } = yield (0, zx_1.$) `git diff --quiet || echo "unstaged"`;
        return !!(stagedChanges || unstagedChanges);
    }
    catch (error) {
        // Git commands might throw if there are changes
        return true;
    }
});
exports.hasUncommittedChanges = hasUncommittedChanges;
const isPushSuccessful = (commitHash) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if commit exists on remote
        const { stdout } = yield (0, zx_1.$) `git branch -r --contains ${commitHash}`;
        return stdout.trim().length > 0;
    }
    catch (error) {
        return false;
    }
});
exports.isPushSuccessful = isPushSuccessful;
const prompt = (message, choices) => __awaiter(void 0, void 0, void 0, function* () {
    return choices ? yield (0, prompts_1.select)({
        message: message,
        choices: choices
    })
        : yield (0, zx_1.question)(message);
});
exports.prompt = prompt;
