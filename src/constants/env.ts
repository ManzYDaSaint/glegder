export const ENV = {
  syncApiUrl: process.env.EXPO_PUBLIC_SYNC_API_URL || 'https://api.glegder.app/v1',
  syncApiKey: process.env.EXPO_PUBLIC_SYNC_API_KEY || '',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  appEnv: process.env.EXPO_PUBLIC_APP_ENV || 'development',
  defaultCurrency: process.env.EXPO_PUBLIC_DEFAULT_CURRENCY || 'MWK',
  otpSmsApiKey: process.env.EXPO_PUBLIC_OTP_SMS_API_KEY || '',
  telcomwBaseUrl: process.env.EXPO_PUBLIC_TELCOMW_BASE_URL || 'https://telcomw.com',
  telcomwSenderId: process.env.EXPO_PUBLIC_TELCOMW_SENDER_ID || 'Glegder',
};
