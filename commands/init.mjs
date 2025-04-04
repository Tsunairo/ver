import { Command } from 'commander';
import path from 'path';
import fs from'fs/promises';
import { question } from 'zx';

const defaultConfig = {
  current: "1.0.0",
  precededBy: "0.0.0",
  releaseBranch: null,
  preReleaseBranches: {
    development: null,
    staging: null
  },
  autoPushToRemote: false,
  pushedToRemote: [],
  remote: "origin"
};

// const initCommand = new Command('init')
//   .description('Initialize version control configuration')
//   .option('-f, --force', 'Force overwrite existing configuration')
//   .action();

const askForBranch = async () => {
  const branch = await question('Enter release branch: ');
  return branch;
}

const init = async (options) => {
  console.log("rada exists");
  const configPath = path.join(process.cwd(), 'ver.config.json');
  
  try {
    const exists = await fs.access(configPath)
      .then(() => true)
      .catch(() => false);

      const releaseBranchInput = await question(`\n\Enter release branch: `);
      const developmentPreReleaseBranchInput = await question(`\n\Enter development release branch: `);
      const stagingPreReleaseBranchInput = await question(`\n\Enter staging release branch: `);
      
    

    if (exists && !options.force) {
      console.error('Configuration file already exists. Use --force to overwrite.');
      process.exit(1);
    }
    
    await fs.writeFile(
      configPath,
      JSON.stringify(defaultConfig, null, 2),
      'utf-8'
    );
    
    console.log('Version control configuration initialized successfully.');
  } catch (error) {
    console.error('Error initializing configuration:', error.message);
    process.exit(1);
  }
}

export default init;

