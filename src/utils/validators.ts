#!/usr/bin/env zx

import { chalk, echo, $ } from 'zx';
import { ValidationResponse, VersionConfig } from './types';

export const validateInitBranch = async (branch: string): Promise<ValidationResponse> => {
  if (!branch) {
    return {
      isValid: false,
      message: 'Branch name cannot be empty.'
    };
  }
  if (/^[a-zA-Z0-9._-]+$/.test(branch)) {
    return {
      isValid: false,
      message: 'Branch name can only contain alphanumeric characters, dots, underscores, and hyphens.'
    };
  }
  const { stdout } = await $`git branch`;
  const branches = stdout.split('\n').map(b => b.trim().replace('* ', ''));
  if (!branches.includes(branch)) {
    return {
      isValid: false,
      message: `Branch ${branch} does not exist in the repository.`
    };
  }
  return {
    isValid: true
  };
};

export const validateInitPreReleaseName = (name: string, otherNames: string[]): ValidationResponse => {
  if (!name) {
    return {
      isValid: false,
      message: 'Pre-release name cannot be empty.'
    };
  }
  if (/^[a-zA-Z0-9._-]+$/.test(name)) {
    return {
      isValid: false,
      message: 'Pre-release name can only contain alphanumeric characters, dots, underscores, and hyphens.'
    };
  }
  if(otherNames.includes(name)) {
    return {
      isValid: false,
      message: `Pre-release name "${name}" already exists. Please choose a different name.`
    };
  }
  return {
    isValid: true
  };
};

export const validateBumpBranch = (branch: string, verConfig: VersionConfig): ValidationResponse => {
  if(branch !== verConfig.releaseBranch) {
    return {
      isValid: false,
      message: `Branch ${branch} is not a valid release branch. Valid branches is: ${verConfig.releaseBranch}`
    };
  }
  if (!verConfig.preReleaseBranches[branch]) {
    return {
      isValid: false,
      message: `Branch ${branch} is not a valid pre-release branch. Valid branches are: ${Object.keys(verConfig.preReleaseBranches).join(', ')}`
    };
  }

  return {
    isValid: true
  }
};

export const validateBumpType = (type: string, branch: string, verConfig: VersionConfig): ValidationResponse => {
  if (!['MAJOR', 'MINOR', 'PATCH', 'PRE-RELEASE'].includes(type)) {
    return {
      isValid: false,
      message: `Invalid type: ${type}. Must be one of MAJOR, MINOR, PATCH, PRE-RELEASE.`
    };
  }
  if(branch === verConfig.releaseBranch && type === "PRE-RELEASE") {
    return {
      isValid: false,
      message: "Pre-release type cannot be used in the release branch."
    };
  }
  if (type === "PRE-RELEASE" && !verConfig.preReleaseBranches[branch]) {
    return {
      isValid: false,
      message: `Branch ${branch} is not a valid pre-release branch. Valid branches are: ${Object.keys(verConfig.preReleaseBranches).join(', ')}`
    };
  }
  return {
    isValid: true
  };
};

export const validateConfig = (config: VersionConfig): ValidationResponse => {
  const requiredFields = ['current', 'releaseBranch', 'preReleaseBranches'];
  const missingFields: string[] = [];
  for (const field of requiredFields) {
    if (!config[field]) {
      missingFields.push(field);
    }
  }
  if(missingFields.length > 0) {
    return {
      isValid: false,
      message: `Missing required fields in version config: ${missingFields.join(', ')}`
    };
  }
  
  return {
    isValid: true
  };
};

export const validateVersion = (version: string): ValidationResponse => {
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  const isValid = semverRegex.test(version);
  if (!isValid) {
    return {
      isValid: false,
      message: `Invalid version format: ${version}. Please use semantic versioning (e.g., 1.0.0).`
    };
  }
  return {
    isValid: true
  };
};

export const isGitRepository = async (): Promise<ValidationResponse> => {
  try {
    await $`git rev-parse --is-inside-work-tree`;
    return {
      isValid: true
    };
  } catch (error) {
    return {
      isValid: false,
      message: 'This command must be run inside a Git repository.'
    }
  }
}