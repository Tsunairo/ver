#!/usr/bin/env zx

import { chalk, echo, question, spinner, fs, argv, $ } from 'zx';
import { GitCommandOutput, VersionConfig } from '../utils/types';
import { validateBumpBranchAndType, validateBumpType, validateConfig, validateVersion } from '../utils/validators';
import { handleError, hasUncommittedChanges, isPushSuccessful, prompt } from '../utils/helpers';

const verConfigPath = "ver.config.json";

// Initialize with default values
let verConfig: VersionConfig = {
  current: '1.0.0',
  precededBy: '',
  releaseBranch: 'main',
  preReleaseBranches: {},
  autoPushToRemote: false,
  pushedToRemote: [],
  remote: 'origin'
};

const pushVersion = async () => {
  const pushOps = [
    $`git push -u ${verConfig.remote} ${verConfig.releaseBranch}`,
    $`git push ${verConfig.remote} ${verConfig.current}`,
  ];
  
  let pushChanges = true;
  if (!verConfig.autoPushToRemote) {
    const pushInput = await question(`\nPush new version ${verConfig.current}?`, { choices: ['yes', 'no'] });
    if (pushInput.toLowerCase() === "no") {
      pushChanges = false;
    }
  }
  const { stdout: commitHash } = await $`git rev-parse HEAD`;

  if(pushChanges) {
    try {
      await Promise.all(pushOps);
  
      const isPushed = await isPushSuccessful(commitHash); 
      verConfig.pushedToRemote.push(verConfig.current);
      fs.writeFileSync(verConfigPath, JSON.stringify(verConfig, null, 2));
      echo(chalk.greenBright(`Version ${verConfig.current} pushed successfully.`));
    }
    catch(error) {
      handleError(error as Error, "Pushing Version");
      echo(chalk.redBright(`Failed to push version ${verConfig.current}.`));
      process.exit(1);
    }
  }
  else {
    echo(chalk.yellowBright(`Version ${verConfig.current}  not pushed successfully.`));
  }
};

const createVersion = async (newVersion: string): Promise<void> => {
  if (await hasUncommittedChanges()) {
    const proceed = await prompt(
      chalk.yellow('\nThere are uncommitted changes in your working directory. Proceed anyway ? '), [{name: 'Yes', value: 'yes'}, {name: 'No', value: 'no'}]
    );
    
    if (proceed.toLowerCase() !== 'yes') {
      echo(chalk.yellowBright('Version creation cancelled. Please commit or stash your changes first.'));
      process.exit(1);
    }
  }
  await spinner(chalk.blueBright("Creating version " + newVersion), async () => {
    verConfig = { ...verConfig, current: newVersion };
    fs.writeFileSync(verConfigPath, JSON.stringify(verConfig, null, 2));

    try {
      const ops = [
        $`git add .`,
        $`git commit -m"New version: ${newVersion}"`,
        $`git tag -a ${newVersion} -m "New version: ${newVersion}"`
      ];
      await Promise.all(ops);

      console.log(chalk.greenBright(`Version ${newVersion} created 👍✅!`));
      await pushVersion();
    } catch (error) {
      handleError(error as Error, "Pushing Version")
    }
  });
};

const bump = async (type: string): Promise<void> => {
  // Update config reading:
  try {
    verConfig = JSON.parse(fs.readFileSync(verConfigPath, 'utf8'));
    const validateConfigResponse = validateConfig(verConfig);
    if (!validateConfigResponse.isValid) {
      handleError(new Error(validateConfigResponse.message), 'Configuration Validation');
      process.exit(1);
    }
  } catch (error) {
    echo("rada")
    handleError(error as Error, 'Configuration');
    process.exit(1);
  }
  try {
    let branch: string = (await $`git rev-parse --abbrev-ref HEAD`).stdout.trim();
    const validateBranchResponse = validateBumpBranchAndType(branch, type.toUpperCase(), verConfig);
    if (!validateBranchResponse.isValid) {
      handleError(new Error(validateBranchResponse.message), "Bump Branch & Type Validation");
      process.exit(1);
    }
    await spinner('Pulling...', () => $`git pull`);

    
    let version = verConfig.current.split("-")[0] ?? "1.0.0";
    console.log(version)
    let [majorVersion, minorVersion, patchVersion] = version.split(".").map(Number);

    let preRelease: string | undefined;
    let preReleaseName: string | undefined;
    let preReleaseNum: number | undefined;

    if (branch !== verConfig.releaseBranch) {
      preRelease = verConfig.current.split("-").filter((_, index) => index > 0).join("-") || branch.split("/").join(".") + ".0";
      preReleaseName = preRelease.split(".").filter((_, index, array) => index < array.length - 1).join(".");
      preReleaseNum = Number(preRelease.split(".")[preRelease.split(".").length - 1]);
    }

    if(branch === verConfig.releaseBranch) {
      if(type === "MAJOR") {
        majorVersion++;
        minorVersion = 0;
        patchVersion = 0;
      }
      else if(type === "MINOR") {
        minorVersion++;
        patchVersion = 0;
      }
      else if(type === "PATCH") {
        patchVersion++;
      }
    }
    else {
      if (preRelease) {
        preReleaseNum = (preReleaseNum ?? 0) + 1;
        preRelease = `${preReleaseName}.${preReleaseNum}`;
      } else {
        if (branch !== verConfig.releaseBranch) {
          preReleaseNum = 1;
          preReleaseName = branch.split("/").join(".");
          preRelease = `${preReleaseName}.${preReleaseNum}`;
        }
      }
    }
    
    const newVersion = `${majorVersion}.${minorVersion}.${patchVersion}${branch === verConfig.releaseBranch ? "" : "-" + preRelease}`;
    const validateVersionResponse = validateVersion(newVersion);
    if (!validateVersionResponse.isValid) {
      handleError(new Error(validateVersionResponse.message), "Version Validation");
      process.exit(1);
    }
    
    const pushNewVersionInput = await prompt(`\nCreate new version: ${newVersion} ?`, [{name: 'Yes', value: 'yes'}, {name: 'No', value: 'no'}]);
    if (pushNewVersionInput.toLowerCase() === "yes") {
      await createVersion(newVersion);
    } else {
      echo(chalk.redBright("Version not pushed"));
      process.exit(0);
    }
  }
  catch(error) {
    handleError(error as Error, 'Bumping Version');
  }
};

export default bump;
