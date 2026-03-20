import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'AFeeree Certification Program',
  slug: config.slug ?? 'afeeree-certification-program',
  plugins: (
    (config.plugins ?? []) as (string | [string, unknown])[]
  ).filter((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    return name !== 'expo-video';
  }),
});
