#!/usr/bin/env zx

import { chalk, echo, question, spinner, fs, argv, $ } from 'zx';
import { VersionConfig } from '../resources/types';
import { validateInitBranch, validateInitPreReleaseName } from '../resources/validators';


type Question<T> = {
  name: string;
  message: string;
  default?: string;
  validate?: (input: string) => Promise<string | boolean> | boolean;
  answer: (input: string) => T;
}

const projectNameQuestion: Question<string> = {
  name: 'name',
  message: 'Project name:',
  default: 'my-project',
  validate: (input: string) => {
    if (!input) {
      console.log(chalk.redBright('Project name cannot be empty.'));
      return false;
    }
    if (/^[a-zA-Z0-9._-]+$/.test(input)) {
      console.log(chalk.redBright('Project name can only contain alphanumeric characters, dots, underscores, and hyphens.'));
      return false;
    }
    return true;
  },
  answer: (input: string) => input.trim()
};

const currentVersionQuestion: Question<string> = {
  name: 'current',
  message: 'Current version (e.g., 1.0.0):',
  default: '1.0.0',
  validate: (input: string) => {
    const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    if (!semverRegex.test(input)) {
      console.log(chalk.redBright('Invalid version format. Please use semantic versioning (e.g., 1.0.0).'));
      return false;
    }
    return true;
  },
  answer: (input: string) => input.trim()
};

const releaseBranchQuestion: Question<string> = {
  name: 'releaseBranch',
  message: 'Release branch (e.g., main):',
  default: 'current',
  validate: async (input: string) => {
    const validateBranchResponse = await validateInitBranch(input.trim());
    if (!validateBranchResponse.isValid) {
      echo(chalk.redBright(validateBranchResponse.message));
      return false;
    }
    return true;
  },
  answer: (input: string) => input.trim() || 'current'
};

const preReleaseBranchesQuestion: Question<Map<string, string>> = {
  name: 'preReleaseBranches',
  message: 'Pre-release branches ([branch:release-name] comma-separated, e.g., development:dev,staging:staging):',
  default: 'dev,staging',
  validate: async (input: string) => {
    const branchAndPrNames = input.split(',').map(b => b.trim());
    for (const branch of branchAndPrNames) {
      if (!branch.includes(':')) {
        return `Invalid format for branch: ${branch}. Use branch:release-name format.`;
      }
      else {
        const [branchName, releaseName] = branch.split(':');
        const validateBranchResponse = await validateInitBranch(branchName.trim());
        const validatePreReleaseNameResponse = validateInitPreReleaseName(releaseName.trim(), branchAndPrNames.map(b => b.split(':')[1].trim()));
        if(!validateBranchResponse.isValid) {
          echo(chalk.redBright(validateBranchResponse.message));
          return false;
        }
        if(!validatePreReleaseNameResponse.isValid) {
          echo(chalk.redBright(validatePreReleaseNameResponse.message));
          return false;
        }
        return true;
      }
    }
    return true;
  },
  answer: (input: string) => {
    const branchesMap = new Map<string, string>();
    input.split(',').forEach(branch => {
      const [branchName, releaseName] = branch.split(':');
      branchesMap.set(branchName.trim(), releaseName.trim());
    });
    return branchesMap;
  }
};

const autoPushToRemoteQuestion: Question<boolean> = {
  name: 'autoPushToRemote',
  message: 'Auto push to remote? (y/n):',
  default: 'yes',
  answer: (input: string) => input.toLowerCase() === 'yes' || input.toLowerCase() === 'y'
};

const questions = [
  projectNameQuestion,
  currentVersionQuestion,
  releaseBranchQuestion,
  preReleaseBranchesQuestion,
  autoPushToRemoteQuestion
];

const init = async () => {
  const verConfig: VersionConfig = {
    current: '1.0.0',
    precededBy: '',
    releaseBranch: '',
    preReleaseBranches: {},
    autoPushToRemote: false,
    pushedToRemote: [],
    remote: 'origin'
  };

  for (const q of questions) {
    let answer;
    do {
      const userInput = await question(q.message);
      if (q.validate) {
        const validationResult = await q.validate(userInput);
        if (validationResult !== true) {
          echo(chalk.redBright(validationResult));
          continue;
        }
        else {
          answer = q.answer(userInput);
        }
      }
      break;
    } while (true);
    verConfig[q.name] = answer;
  }

  fs.writeFileSync('verConfig.json', JSON.stringify(verConfig, null, 2));
  echo(chalk.greenBright('Version configuration initialized successfully.'));
};

export default init;