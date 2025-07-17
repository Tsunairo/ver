#!/usr/bin/env zx

import { chalk, echo, question, spinner, fs, argv, $ } from 'zx';
import { VersionConfig } from '../utils/types';
import { isGitRepository, validateInitBranch, validateInitPreReleaseName, validateRemote } from '../utils/validators';
import { prompt } from '../utils/helpers';


type Question<T> = {
  name: string;
  message: string;
  choices?: {name: string, value: string}[];
  required: boolean;
  default?: any;
  preCondition?: () => boolean | Promise<boolean>;
  validate?: (input: string) => Promise<string | boolean> | boolean;
  answer: (input: string) => T;
}

const projectNameQuestion: Question<string> = {
  name: 'name',
  message: 'Project name:',
  default: 'my-project',
  required: true,
  validate: (input: string) => {
    if (!input) {
      console.log(chalk.redBright('Project name cannot be empty.'));
      return false;
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(input)) {
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
  required: true,
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
  required: true,
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
  message: 'Pre-release branches - comma-separated, e.g., development:dev,staging:staging',
  default: {},
  required: false,
  validate: async (input: string) => {
    const branchAndPrNames = input.split(',').map(b => b.trim());
    for (const branch of branchAndPrNames) {
      if (!branch.includes(':')) {
        return `Invalid format for branch: ${branch}. Use branch:release-name format.`;
      }

      const [branchName, releaseName] = branch.split(':');
      const validateBranchResponse = await validateInitBranch(branchName.trim());
      const validatePreReleaseNameResponse = validateInitPreReleaseName(
        releaseName.trim(),
        branchAndPrNames.map(b => b.split(':')[1].trim())
      );

      if (!validateBranchResponse.isValid) {
        echo(chalk.redBright(validateBranchResponse.message));
        return false;
      }
      if (!validatePreReleaseNameResponse.isValid) {
        echo(chalk.redBright(validatePreReleaseNameResponse.message));
        return false;
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

const remoteQuestion: Question<string> = {
  name: 'remote',
  message: 'Remote (e.g., origin):',
  required: true,
  preCondition: async () => {
    const isGitRepositoryResponse = await isGitRepository();
    return isGitRepositoryResponse.isValid;
  },
  validate: async (input: string) => {
    const validateRemoteResponse = await validateRemote(input.trim());
    if (!validateRemoteResponse.isValid) {
      echo(chalk.redBright(validateRemoteResponse.message));
      return false;
    }
    return true;
  },
  answer: (input: string) => input.trim() || 'current'
};

const autoPushToRemoteQuestion: Question<boolean> = {
  name: 'autoPushToRemote',
  message: 'Auto push to remote?',
  required: true,
  preCondition: async () => {
    const isGitRepositoryResponse = await isGitRepository();
    return isGitRepositoryResponse.isValid;
  },
  choices: [{name: "Yes", value: "yes"}, {name: "No", value: "no"}],
  default: 'yes',
  answer: (input: string) => input.toLowerCase() === 'yes'
};

const questions = [
  projectNameQuestion,
  currentVersionQuestion,
  releaseBranchQuestion,
  preReleaseBranchesQuestion,
  remoteQuestion,
  autoPushToRemoteQuestion
];

const init = async () => {
  echo(chalk.blueBright('Initializing version configuration...'));
  if (fs.existsSync('ver.config.json')) {
    const overwrite = await question('Configuration exists. Overwrite? (y/n):');
    if (overwrite.toLowerCase() !== 'y') {
      echo(chalk.yellow('Initialization aborted.'));
      return;
    }
  }
  const verConfig: VersionConfig = {
    current: '1.0.0',
    precededBy: '',
    releaseBranch: '',
    preReleaseBranches: {},
    autoPushToRemote: false,
    pushedToRemote: [],
    remote: '',
  };

  for (const q of questions) {
    if (q.preCondition && !(await q.preCondition())) {
      // echo(chalk.yellow(`Skipping question: ${q.message}`));
      continue;
    }
    let answer;
    do {
      const userInput = await prompt(q.message, q.choices);
      if(!userInput && !q.required) {
        answer = q.default;
      }
      else if (q.validate) {
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
    (verConfig as any)[q.name] = answer; // TODO: Create a proper type-safe solution
  }

  fs.writeFileSync('ver.config.json', JSON.stringify(verConfig, null, 2));
  echo(chalk.greenBright('Version configuration initialized successfully.'));
};

export default init;