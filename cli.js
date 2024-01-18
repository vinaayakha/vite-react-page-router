#!/usr/bin/env node
const program = require('commander');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');
const { execSync } = require('child_process');
const spinners = require('cli-spinners');

function simulateSpinner(text, delay = 100) {
  const spinnerFrames = spinners.dots.frames;
  let i = 0;
  return setInterval(() => {
    process.stdout.write(`\r${spinnerFrames[i]} ${text}`);
    i = (i + 1) % spinnerFrames.length;
  }, delay);
}

function stopSpinner(interval, success = true) {
  clearInterval(interval);
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(`${success ? "success": "failed"} ${interval === 0 ? 'Done' : 'Finished'}`);
}

program
  .version('1.0.1')
  .description('Create a new React app based on a template');

program
  .command('create <app-name>')
  .description('Create a new React app')
  .action(async (appName) => {
    const templateReleaseUrl = 'https://github.com/vinaayakha/react-template/archive/refs/tags/v1.zip';
    const destinationPath = path.resolve(process.cwd(), appName);

    // Check if the destination directory already exists
    if (fs.existsSync(destinationPath)) {
      console.error(`Error: Directory '${appName}' already exists.`);
      process.exit(1);
    }

    try {
      // Download the ZIP archive
      const response = await axios.get(templateReleaseUrl, { responseType: 'arraybuffer' });

      // Save the ZIP archive to a file
      const zipFilePath = path.join(process.cwd(), 'template.zip');
      fs.writeFileSync(zipFilePath, response.data);

      // Create a spinner/loader
      const spinnerInterval = simulateSpinner('Downloading template and initializing Git repository');

      // Unzip the downloaded file
      await extract(zipFilePath, { dir: destinationPath });

      // Remove the temporary ZIP file
      fs.unlinkSync(zipFilePath);

      // Initialize a Git repository
      execSync('git init', { cwd: destinationPath, stdio: 'inherit' });

      // Stop the spinner
      stopSpinner(spinnerInterval);

      // Additional steps
      console.log('Next steps:');
      console.log(`1. Navigate to the created directory: cd ${appName}`);
      console.log('2. Install dependencies: npm install');
      console.log('3. Start the app: npm start');
    } catch (err) {
      console.error('Error:', err.message);
      // Stop the spinner with an error symbol
      stopSpinner(0, false);
    }
  });

program.parse(process.argv);
