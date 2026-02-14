// Square Payment Configuration Check
// This file helps verify Square is configured correctly

export const getSquareConfig = () => {
  const appId = process.env.EXPO_PUBLIC_SQUARE_APP_ID;
  const locationId = process.env.EXPO_PUBLIC_SQUARE_LOCATION_ID;

  return {
    appId: appId || null,
    locationId: locationId || null,
    isConfigured: !!(appId && locationId),
    isSandbox: appId?.startsWith('sandbox') || appId?.startsWith('sq0idp'),
  };
};

export const logSquareConfig = () => {
  const config = getSquareConfig();

  if (config.isConfigured) {
    console.log('✅ Square is configured');
    console.log('   App ID:', config.appId?.substring(0, 15) + '...');
    console.log('   Location ID:', config.locationId?.substring(0, 10) + '...');
    console.log('   Mode:', config.isSandbox ? 'Sandbox (testing)' : 'Production (live)');
  } else {
    console.log('❌ Square is NOT configured');
    if (!config.appId) console.log('   Missing: EXPO_PUBLIC_SQUARE_APP_ID');
    if (!config.locationId) console.log('   Missing: EXPO_PUBLIC_SQUARE_LOCATION_ID');
  }

  return config;
};
