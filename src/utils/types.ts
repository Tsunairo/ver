export interface VersionConfig {
  current: string;
  precededBy: string;
  releaseBranch: string;
  preReleaseBranches: { [key: string]: string };
  autoPushToRemote: boolean;
  pushedToRemote: string[];
  remote: string;
}

type VersionType = 'MAJOR' | 'MINOR' | 'PATCH' | 'PRE-RELEASE';
type Branch = string;

interface VersionParts {
  major: number;
  minor: number;
  patch: number;
  preRelease?: string;
}

export interface ValidationResponse {
  isValid: boolean;
  message?: string;
}

export interface GitCommandOutput {
  stdout: string;    // Standard output
  stderr: string;    // Error output
  exitCode: number;  // 0 for success, non-zero for failure
}
