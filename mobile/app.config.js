module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins || []),
    [
      "expo-build-properties",
      {
        android: {
          kotlinVersion: "1.9.25",
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          minSdkVersion: 24,
          ndkVersion: "27.1.12297006",
          gradleProperties: {
            "org.gradle.jvmargs": "-Xmx4096m -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8",
            "org.gradle.daemon": "false",
            "org.gradle.parallel": "true",
            "android.useAndroidX": "true",
            "android.enableJetifier": "true",
            "kotlin.code.style": "official",
          },
        },
      },
    ],
  ],
});
