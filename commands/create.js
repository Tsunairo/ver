#!/usr/bin/env zx
import fs from 'fs';
import { chalk, echo, question, spinner } from 'zx';

$.verbose = false;
console.log(chalk.greenBright("Version Script Initiated ⚒️\n"));

const type = argv.type.toUpperCase() ?? "patch";
const verConfigPath = "ver.config.json";

let verConfig = JSON.parse(fs.readFileSync(verConfigPath, 'utf8'));

const createNewVersion = async branch => {
    let version = verConfig.current.split("-")[0] ?? "1.0.0";
    let majorVersion = parseInt(version.split(".")[0]);
    let minorVersion = parseInt(version.split(".")[1]);
    let patchVersion = parseInt(version.split(".")[2]);
    let preRelease, preReleaseName, preReleaseNum;

    if(branch !== verConfig.releaseBranch) {
        preRelease = verConfig.current.split("-").filter((item, index) => index > 0).join("-") ?? branch.split("/").join(".") + ".0";
        preReleaseName = preRelease.split(".").filter((item, index, array) => index < array.length -1).join(".");
        preReleaseNum = preRelease.split(".")[preRelease.split(".").length - 1];
    }
    if(type !== "PRE-RELEASE" && branch !== verConfig.releaseBranch) {
        throw Error(`${type} can only be used in ${verConfig.releaseBranch} branch`);
    }
    switch(type) {
        case "MAJOR":
            majorVersion++;
            minorVersion = 0;
            patchVersion = 0;
        break;
        case "MINOR":
            minorVersion++;
            patchVersion = 0;
        break;
        case "PATCH":
            patchVersion++;
        break;
        case "PRE-RELEASE":
            // TODO: fetch users to confirm pre release
            if(preRelease) {
                preReleaseNum++;
                preRelease = `${preReleaseName}.${preReleaseNum}`;
            }
            else {
                if(branch !== verConfig.releaseBranch) {
                    preReleaseNum = 1;
                    preReleaseName = branch.split("/").join(".");
                    preRelease = `${preReleaseName}.${preReleaseNum}`;
                }
                else {
                    throw new Error(`${type} can't be used in ${branch} branch`)
                }
            }
        break;
        default:
            throw new Error(`Release type ${type} doesn't exist`);
    }

    const newVersion = `${majorVersion}.${minorVersion}.${patchVersion}${branch === verConfig.releaseBranch ? "" : "-" + preRelease}`;
    const createNewVersionInput = await question(`\n\Do you want to create this new version: ${chalk.yellowBright(newVersion)}? (y/n) :`);
    if(createNewVersionInput.toLowerCase() === "y") {
        verConfig = {...verConfig, precededBy: verConfig.current, current: newVersion};
        fs.writeFileSync(verConfigPath, JSON.stringify(verConfig, null, 2));
        
        await $`git add .`;
        await $`git commit -m"New version: ${newVersion}"`;
        await $`git commit -m"New version:${newVersion} -m "New version: ${newVersion}"`;
        
        let pushToRemote = verConfig.autoPushToRemote ? verConfig.autoPushToRemote : (await question(`Do you want to push this new version? (y/n) : `)).toLowerCase() === "y";
        if(pushToRemote) {
            let pushedToRemote = false;
            try {
                await $`git push`;
                await $`git push ${verConfig.remote} ${newVersion}`;
                pushedToRemote = true;
                console.log(chalk.greenBright(`Version ${newVersion} pushed successfully 👍✅!`));
            }
            catch(error) {
                console.error(chalk.redBright(`Error occurred while pushing \n ${error}`));
            }
            finally {
                verConfig = {...verConfig, pushedToRemote};
                fs.writeFileSync(verConfigPath, JSON.stringify(verConfig, null, 2));
            }
        }
    }
    else {
        echo(chalk.redBright("Version not pushed"));
    }
};

try {
    let branch = (await $`git branch --show-current | sed 's|origin/||' | head -n 1 | xargs`).toString().trim();
    const validBranches = [verConfig.releaseBranch, ...Object.values(verConfig.preReleaseBranches)];
    if(validBranches.includes(branch)) {
        await spinner('Pulling...', () => $`git pull`);
        createNewVersion(branch);
    }
    else {
        console.error(chalk.redBright(`A version can't be created from this branch.\nValid branches include :\n${validBranches.join("\n")}`));
    }
}
catch(error) {
    console.log(error);
}