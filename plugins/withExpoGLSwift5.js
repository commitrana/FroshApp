const { withPodfile } = require('@expo/config-plugins');

const MARKER = '# expo-gl: pin to Swift 5 language mode';

const SNIPPET = `
    ${MARKER}
    # ExpoGL.podspec sets no s.swift_version, so CocoaPods pins the pod to the
    # toolchain version (Swift 6.x). GLView's EXGLContextDelegate conformance is a
    # hard error under Swift 6 actor isolation. Swift 5 mode makes it a warning.
    installer.pods_project.targets.each do |target|
      next unless target.name == 'ExpoGL'
      target.build_configurations.each do |config|
        config.build_settings['SWIFT_VERSION'] = '5.0'
      end
    end
`;

module.exports = function withExpoGLSwift5(config) {
  return withPodfile(config, (config) => {
    const contents = config.modResults.contents;
    if (contents.includes(MARKER)) return config;

    config.modResults.contents = contents.replace(
      'post_install do |installer|',
      `post_install do |installer|\n${SNIPPET}`
    );
    return config;
  });
};
