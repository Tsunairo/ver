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
exports.validateRemote = exports.isGitRepository = exports.validateVersion = exports.validateConfig = exports.validateBumpType = exports.validateBumpBranch = exports.validateInitPreReleaseName = exports.validateInitBranch = void 0;
const zx_1 = require("zx");
const validateInitBranch = (branch) => __awaiter(void 0, void 0, void 0, function* () {
    if (!branch) {
        return {
            isValid: false,
            message: 'Branch name cannot be empty.'
        };
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(branch)) {
        return {
            isValid: false,
            message: 'Branch name can only contain alphanumeric characters, dots, underscores, and hyphens.'
        };
    }
    const { stdout } = yield (0, zx_1.$) `git branch`;
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
});
exports.validateInitBranch = validateInitBranch;
const validateInitPreReleaseName = (name, otherNames) => {
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
    if (otherNames.includes(name)) {
        return {
            isValid: false,
            message: `Pre-release name "${name}" already exists. Please choose a different name.`
        };
    }
    return {
        isValid: true
    };
};
exports.validateInitPreReleaseName = validateInitPreReleaseName;
const validateBumpBranch = (branch, verConfig) => {
    if (branch !== verConfig.releaseBranch) {
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
    };
};
exports.validateBumpBranch = validateBumpBranch;
const validateBumpType = (type, branch, verConfig) => {
    if (!['MAJOR', 'MINOR', 'PATCH', 'PRE-RELEASE'].includes(type)) {
        return {
            isValid: false,
            message: `Invalid type: ${type}. Must be one of MAJOR, MINOR, PATCH, PRE-RELEASE.`
        };
    }
    if (branch === verConfig.releaseBranch && type === "PRE-RELEASE") {
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
exports.validateBumpType = validateBumpType;
const validateConfig = (config) => {
    const requiredFields = ['current', 'releaseBranch', 'preReleaseBranches'];
    const missingFields = [];
    for (const field of requiredFields) {
        if (!config[field]) {
            missingFields.push(field);
        }
    }
    if (missingFields.length > 0) {
        return {
            isValid: false,
            message: `Missing required fields in version config: ${missingFields.join(', ')}`
        };
    }
    return {
        isValid: true
    };
};
exports.validateConfig = validateConfig;
const validateVersion = (version) => {
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
exports.validateVersion = validateVersion;
const isGitRepository = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, zx_1.$) `git rev-parse --is-inside-work-tree`;
        return {
            isValid: true
        };
    }
    catch (error) {
        return {
            isValid: false,
            message: 'This command must be run inside a Git repository.'
        };
    }
});
exports.isGitRepository = isGitRepository;
const validateRemote = (remote) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, zx_1.$) `git remote get-url ${remote}`;
        return { isValid: true };
    }
    catch (_a) {
        return { isValid: false, message: `Remote "${remote}" does not exist.` };
    }
});
exports.validateRemote = validateRemote;
