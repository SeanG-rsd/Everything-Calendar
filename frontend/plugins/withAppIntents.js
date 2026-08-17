const { withDangerousMod, withXcodeProject, IOSConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Copies the Swift App Intents sources from ios-plugins/AppIntents/ (kept in
// git) into the generated ios/<ProjectName>/AppIntents/ directory and
// registers them on the main app target, every time `expo prebuild` runs.
// See the "iOS Shortcuts" plan doc for why these live outside ios/ (never
// checked in) instead of using a bare-workflow ios/ folder.

const GROUP_NAME = 'AppIntents';

function withAppIntentsFiles(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const sourceDir = path.join(config.modRequest.projectRoot, 'ios-plugins', GROUP_NAME);
      const targetDir = path.join(config.modRequest.platformProjectRoot, config.modRequest.projectName, GROUP_NAME);

      fs.mkdirSync(targetDir, { recursive: true });
      for (const file of fs.readdirSync(sourceDir)) {
        fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
      }

      return config;
    },
  ]);
}

function withAppIntentsXcode(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectName = config.modRequest.projectName;
    const sourceDir = path.join(config.modRequest.projectRoot, 'ios-plugins', GROUP_NAME);
    const files = fs.readdirSync(sourceDir).filter((file) => file.endsWith('.swift'));

    IOSConfig.XcodeUtils.ensureGroupRecursively(project, GROUP_NAME);
    const { uuid: targetUuid } = IOSConfig.XcodeUtils.getApplicationNativeTarget({ project, projectName });

    for (const file of files) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
        filepath: `${projectName}/${GROUP_NAME}/${file}`,
        groupName: GROUP_NAME,
        project,
        targetUuid,
      });
    }

    return config;
  });
}

module.exports = function withAppIntents(config) {
  config = withAppIntentsFiles(config);
  config = withAppIntentsXcode(config);
  return config;
};
