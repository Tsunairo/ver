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
const zx_1 = require("zx");
const validators_1 = require("../utils/validators");
const helpers_1 = require("../utils/helpers");
const projectNameQuestion = {
    name: 'name',
    message: 'Project name:',
    default: 'my-project',
    required: true,
    validate: (input) => {
        if (!input) {
            console.log(zx_1.chalk.redBright('Project name cannot be empty.'));
            return false;
        }
        if (!/^[a-zA-Z0-9._-]+$/.test(input)) {
            console.log(zx_1.chalk.redBright('Project name can only contain alphanumeric characters, dots, underscores, and hyphens.'));
            return false;
        }
        return true;
    },
    answer: (input) => input.trim()
};
const currentVersionQuestion = {
    name: 'current',
    message: 'Current version (e.g., 1.0.0):',
    default: '1.0.0',
    required: true,
    validate: (input) => {
        const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
        if (!semverRegex.test(input)) {
            console.log(zx_1.chalk.redBright('Invalid version format. Please use semantic versioning (e.g., 1.0.0).'));
            return false;
        }
        return true;
    },
    answer: (input) => input.trim()
};
const releaseBranchQuestion = {
    name: 'releaseBranch',
    message: 'Release branch (e.g., main):',
    required: true,
    default: 'current',
    validate: (input) => __awaiter(void 0, void 0, void 0, function* () {
        const validateBranchResponse = yield (0, validators_1.validateInitBranch)(input.trim());
        if (!validateBranchResponse.isValid) {
            (0, zx_1.echo)(zx_1.chalk.redBright(validateBranchResponse.message));
            return false;
        }
        return true;
    }),
    answer: (input) => input.trim() || 'current'
};
const preReleaseBranchesQuestion = {
    name: 'preReleaseBranches',
    message: 'Pre-release branches - comma-separated, e.g., development:dev,staging:staging',
    default: {},
    required: false,
    validate: (input) => __awaiter(void 0, void 0, void 0, function* () {
        const branchAndPrNames = input.split(',').map(b => b.trim());
        for (const branch of branchAndPrNames) {
            if (!branch.includes(':')) {
                return `Invalid format for branch: ${branch}. Use branch:release-name format.`;
            }
            const [branchName, releaseName] = branch.split(':');
            const validateBranchResponse = yield (0, validators_1.validateInitBranch)(branchName.trim());
            const validatePreReleaseNameResponse = (0, validators_1.validateInitPreReleaseName)(releaseName.trim(), branchAndPrNames.map(b => b.split(':')[1].trim()));
            if (!validateBranchResponse.isValid) {
                (0, zx_1.echo)(zx_1.chalk.redBright(validateBranchResponse.message));
                return false;
            }
            if (!validatePreReleaseNameResponse.isValid) {
                (0, zx_1.echo)(zx_1.chalk.redBright(validatePreReleaseNameResponse.message));
                return false;
            }
        }
        return true;
    }),
    answer: (input) => {
        const branchesMap = new Map();
        input.split(',').forEach(branch => {
            const [branchName, releaseName] = branch.split(':');
            branchesMap.set(branchName.trim(), releaseName.trim());
        });
        return branchesMap;
    }
};
const remoteQuestion = {
    name: 'remote',
    message: 'Remote (e.g., origin):',
    required: true,
    preCondition: () => __awaiter(void 0, void 0, void 0, function* () {
        const isGitRepositoryResponse = yield (0, validators_1.isGitRepository)();
        return isGitRepositoryResponse.isValid;
    }),
    validate: (input) => __awaiter(void 0, void 0, void 0, function* () {
        const validateRemoteResponse = yield (0, validators_1.validateRemote)(input.trim());
        if (!validateRemoteResponse.isValid) {
            (0, zx_1.echo)(zx_1.chalk.redBright(validateRemoteResponse.message));
            return false;
        }
        return true;
    }),
    answer: (input) => input.trim() || 'current'
};
const autoPushToRemoteQuestion = {
    name: 'autoPushToRemote',
    message: 'Auto push to remote?',
    required: true,
    preCondition: () => __awaiter(void 0, void 0, void 0, function* () {
        const isGitRepositoryResponse = yield (0, validators_1.isGitRepository)();
        return isGitRepositoryResponse.isValid;
    }),
    choices: [{ name: "Yes", value: "yes" }, { name: "No", value: "no" }],
    default: 'yes',
    answer: (input) => input.toLowerCase() === 'yes'
};
const questions = [
    projectNameQuestion,
    currentVersionQuestion,
    releaseBranchQuestion,
    preReleaseBranchesQuestion,
    remoteQuestion,
    autoPushToRemoteQuestion
];
const init = () => __awaiter(void 0, void 0, void 0, function* () {
    (0, zx_1.echo)(zx_1.chalk.blueBright('Initializing version configuration...'));
    if (zx_1.fs.existsSync('ver.config.json')) {
        const overwrite = yield (0, zx_1.question)('Configuration exists. Overwrite? (y/n):');
        if (overwrite.toLowerCase() !== 'y') {
            (0, zx_1.echo)(zx_1.chalk.yellow('Initialization aborted.'));
            return;
        }
    }
    const verConfig = {
        current: '1.0.0',
        precededBy: '',
        releaseBranch: '',
        preReleaseBranches: {},
        autoPushToRemote: false,
        pushedToRemote: [],
        remote: '',
    };
    for (const q of questions) {
        if (q.preCondition && !(yield q.preCondition())) {
            // echo(chalk.yellow(`Skipping question: ${q.message}`));
            continue;
        }
        let answer;
        do {
            const userInput = yield (0, helpers_1.prompt)(q.message, q.choices);
            if (!userInput && !q.required) {
                answer = q.default;
            }
            else if (q.validate) {
                const validationResult = yield q.validate(userInput);
                if (validationResult !== true) {
                    (0, zx_1.echo)(zx_1.chalk.redBright(validationResult));
                    continue;
                }
                else {
                    answer = q.answer(userInput);
                }
            }
            break;
        } while (true);
        verConfig[q.name] = answer; // TODO: Create a proper type-safe solution
    }
    zx_1.fs.writeFileSync('ver.config.json', JSON.stringify(verConfig, null, 2));
    (0, zx_1.echo)(zx_1.chalk.greenBright('Version configuration initialized successfully.'));
});
exports.default = init;
