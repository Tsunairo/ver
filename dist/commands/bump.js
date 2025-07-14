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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const zx_1 = require("zx");
const validators_1 = require("../utils/validators");
const helpers_1 = require("../utils/helpers");
let type = (_a = zx_1.argv.type) === null || _a === void 0 ? void 0 : _a.toUpperCase();
const verConfigPath = "ver.config.json";
// Initialize with default values
let verConfig = {
    current: '1.0.0',
    precededBy: '',
    releaseBranch: 'main',
    preReleaseBranches: {},
    autoPushToRemote: false,
    pushedToRemote: [],
    remote: 'origin'
};
const pushVersion = () => __awaiter(void 0, void 0, void 0, function* () {
    const pushOps = [
        (0, zx_1.$) `git push -u ${verConfig.remote} ${verConfig.releaseBranch}`,
        (0, zx_1.$) `git push ${verConfig.remote} ${verConfig.current}`,
    ];
    let pushChanges = true;
    if (!verConfig.autoPushToRemote) {
        const pushInput = yield (0, zx_1.question)(`\nPush new version ${verConfig.current}?`, { choices: ['yes', 'no'] });
        if (pushInput.toLowerCase() === "no") {
            pushChanges = false;
        }
    }
    const { stdout: commitHash } = yield (0, zx_1.$) `git rev-parse HEAD`;
    if (pushChanges) {
        try {
            yield Promise.all(pushOps);
            const isPushed = yield (0, helpers_1.isPushSuccessful)(commitHash);
            verConfig.pushedToRemote.push(verConfig.current);
            zx_1.fs.writeFileSync(verConfigPath, JSON.stringify(verConfig, null, 2));
            (0, zx_1.echo)(zx_1.chalk.greenBright(`Version ${verConfig.current} pushed successfully.`));
        }
        catch (error) {
            (0, helpers_1.handleError)(error, "Pushing Version");
            (0, zx_1.echo)(zx_1.chalk.redBright(`Failed to push version ${verConfig.current}.`));
            process.exit(1);
        }
    }
    else {
        (0, zx_1.echo)(zx_1.chalk.yellowBright(`Version ${verConfig.current}  not pushed successfully.`));
    }
});
const createVersion = (newVersion) => __awaiter(void 0, void 0, void 0, function* () {
    if (yield (0, helpers_1.hasUncommittedChanges)()) {
        const proceed = yield (0, zx_1.question)(zx_1.chalk.yellow('\nThere are uncommitted changes in your working directory. Proceed anyway? (y/n) '));
        if (proceed.toLowerCase() !== 'y') {
            (0, zx_1.echo)(zx_1.chalk.redBright('Version creation cancelled. Please commit or stash your changes first.'));
            process.exit(1);
        }
    }
    yield (0, zx_1.spinner)(zx_1.chalk.blueBright("Creating version " + newVersion), () => __awaiter(void 0, void 0, void 0, function* () {
        verConfig = Object.assign(Object.assign({}, verConfig), { current: newVersion });
        zx_1.fs.writeFileSync(verConfigPath, JSON.stringify(verConfig, null, 2));
        try {
            const ops = [
                (0, zx_1.$) `git add .`,
                (0, zx_1.$) `git commit -m"New version: ${newVersion}"`,
                (0, zx_1.$) `git tag -a ${newVersion} -m "New version: ${newVersion}"`
            ];
            yield Promise.all(ops);
            console.log(zx_1.chalk.greenBright(`Version ${newVersion} created 👍✅!`));
            yield pushVersion();
        }
        catch (error) {
            (0, helpers_1.handleError)(error, "Pushing Version");
        }
    }));
});
const bump = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Update config reading:
    try {
        verConfig = JSON.parse(zx_1.fs.readFileSync(verConfigPath, 'utf8'));
        const validateConfigResponse = (0, validators_1.validateConfig)(verConfig);
        if (!validateConfigResponse.isValid) {
            (0, helpers_1.handleError)(new Error(validateConfigResponse.message), 'Configuration Validation');
            process.exit(1);
        }
    }
    catch (error) {
        (0, zx_1.echo)("rada");
        (0, helpers_1.handleError)(error, 'Configuration');
        process.exit(1);
    }
    try {
        let branch = (yield (0, zx_1.$) `git branch -r --contains $TAG_COMMIT | grep -v '\->' | sed 's|origin/||' | head -n 1 | xargs`).stdout.trim();
        if (!type) {
        }
        const validateBranchResponse = yield (0, validators_1.validateBumpBranch)(branch, verConfig);
        const validateTypeResponse = (0, validators_1.validateBumpType)(type, branch, verConfig);
        if (!validateBranchResponse.isValid) {
            (0, helpers_1.handleError)(new Error(validateBranchResponse.message), "Bump Branch Validation");
            process.exit(1);
        }
        if (!validateTypeResponse.isValid) {
            (0, helpers_1.handleError)(new Error(validateTypeResponse.message), "Bump Type Validation");
            type = (yield (0, zx_1.question)(`\nVersion type : `, { choices: branch !== verConfig.releaseBranch ? ['MAJOR', 'MINOR', 'PATCH'] : ['PRE-RELEASE'] })).toUpperCase();
        }
        yield (0, zx_1.spinner)('Pulling...', () => (0, zx_1.$) `git pull`);
        let version = (_a = verConfig.current.split("-")[0]) !== null && _a !== void 0 ? _a : "1.0.0";
        let [majorVersion, minorVersion, patchVersion] = version.split(".").map(Number);
        let preRelease;
        let preReleaseName;
        let preReleaseNum;
        if (branch !== verConfig.releaseBranch) {
            preRelease = verConfig.current.split("-").filter((_, index) => index > 0).join("-") || branch.split("/").join(".") + ".0";
            preReleaseName = preRelease.split(".").filter((_, index, array) => index < array.length - 1).join(".");
            preReleaseNum = Number(preRelease.split(".")[preRelease.split(".").length - 1]);
        }
        if (branch === verConfig.releaseBranch) {
            if (type === "MAJOR") {
                majorVersion++;
                minorVersion = 0;
                patchVersion = 0;
            }
            else if (type === "MINOR") {
                minorVersion++;
                patchVersion = 0;
            }
            else if (type === "PATCH") {
                patchVersion++;
            }
        }
        else {
            if (preRelease) {
                preReleaseNum = (preReleaseNum !== null && preReleaseNum !== void 0 ? preReleaseNum : 0) + 1;
                preRelease = `${preReleaseName}.${preReleaseNum}`;
            }
            else {
                if (branch !== verConfig.releaseBranch) {
                    preReleaseNum = 1;
                    preReleaseName = branch.split("/").join(".");
                    preRelease = `${preReleaseName}.${preReleaseNum}`;
                }
            }
        }
        const newVersion = `${majorVersion}.${minorVersion}.${patchVersion}${branch === verConfig.releaseBranch ? "" : "-" + preRelease}`;
        const validateVersionResponse = (0, validators_1.validateVersion)(newVersion);
        if (!validateVersionResponse.isValid) {
            (0, helpers_1.handleError)(new Error(validateVersionResponse.message), "Version Validation");
            process.exit(1);
        }
        const pushNewVersionInput = yield (0, zx_1.question)(`\nCreate new version: ${newVersion} ?`, { choices: ['yes', 'no'] });
        if (pushNewVersionInput.toLowerCase() === "yes") {
            yield createVersion(newVersion);
        }
        else {
            (0, zx_1.echo)(zx_1.chalk.redBright("Version not pushed"));
            process.exit(0);
        }
    }
    catch (error) {
        (0, helpers_1.handleError)(error, 'Bumping Version');
    }
});
exports.default = bump;
