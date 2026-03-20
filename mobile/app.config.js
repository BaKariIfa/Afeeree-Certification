module.exports = ({ config }) => ({
  ...config,
  plugins: (config.plugins || []).filter(
    (plugin) => (Array.isArray(plugin) ? plugin[0] : plugin) !== 'expo-video'
  ),
});
