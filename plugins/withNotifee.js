const { withProjectBuildGradle, withDangerousMod, AndroidConfig } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Expo config plugin to add Notifee Maven repository to Android build.gradle. This is required to fix an error while building development build for Android.
 */
function withNotifee(config) {
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      config.modResults.contents = addNotifeeMavenRepo(
        config.modResults.contents,
      );
    }

    return config;
  });

  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const resPath = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/res/drawable"
      );

      if (!fs.existsSync(resPath)) {
        fs.mkdirSync(resPath, { recursive: true });
      }

      const iconXml = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10 10,-4.48 10,-10S17.52,2 12,2zM13.41,18.09v0.58c0,0.78 -0.63,1.42 -1.41,1.42s-1.41,-0.63 -1.41,-1.42v-0.58c-1.46,-0.41 -2.59,-1.56 -2.59,-3.09h1.77c0,1.02 0.82,1.85 1.83,1.85h1.6c1.01,0 1.83,-0.83 1.83,-1.85 0,-1.02 -0.82,-1.85 -1.83,-1.85H9.82C8.28,12.55 7,11.27 7,9.73c0,-1.53 1.13,-2.68 2.59,-3.09V6.09C9.59,5.31 10.22,4.67 11,4.67s1.41,0.63 1.41,1.42v0.55c1.46,0.41 2.59,1.56 2.59,3.09h-1.77c0,-1.02 -0.82,-1.85 -1.83,-1.85h-1.6c-1.01,0 -1.83,0.83 -1.83,1.85 0,1.02 0.82,1.85 1.83,1.85h3.38c1.54,0 2.82,1.28 2.82,2.82 0,1.53 -1.13,2.68 -2.59,3.09z"/>
</vector>`;

      fs.writeFileSync(path.join(resPath, "ic_notification.xml"), iconXml);

      return config;
    },
  ]);

  return config;
}

function addNotifeeMavenRepo(buildGradle) {
  // Check if already added
  if (buildGradle.includes("@notifee/react-native/android/libs")) {
    return buildGradle;
  }

  const notifeeRepo = `maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }`;
  // Find the allprojects { repositories { block and add the maven repo
  const pattern = /(allprojects\s*\{\s*repositories\s*\{)/;

  if (pattern.test(buildGradle)) {
    return buildGradle.replace(pattern, `$1\n    ${notifeeRepo}`);
  }

  return buildGradle;
}

module.exports = withNotifee;
