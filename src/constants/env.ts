export const ENV = {
  syncApiUrl: process.env.EXPO_PUBLIC_SYNC_API_URL || 'https://api.glegder.app/v1',
  syncApiKey: process.env.EXPO_PUBLIC_SYNC_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJubmRxbGlyY2t0dGJncGRqbGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ1Nzk1MTQsImV4cCI6MjExMDE1NTUxNH0.OuGTggBA9t8nj7naxBMOGQyxL_yEz_FNQ76JtrgDZpA',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rnndqlirckttbgpdjlah.supabase.co',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJubmRxbGlyY2t0dGJncGRqbGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ1Nzk1MTQsImV4cCI6MjExMDE1NTUxNH0.OuGTggBA9t8nj7naxBMOGQyxL_yEz_FNQ76JtrgDZpA',
  appEnv: process.env.EXPO_PUBLIC_APP_ENV || 'production',
  defaultCurrency: process.env.EXPO_PUBLIC_DEFAULT_CURRENCY || 'MWK',
  otpSmsApiKey: process.env.EXPO_PUBLIC_OTP_SMS_API_KEY || 'F4WRB24GIAZMMZ7CUCLI',
  telcomwBaseUrl: process.env.EXPO_PUBLIC_TELCOMW_BASE_URL || 'https://telcomw.com',
  telcomwSenderId: process.env.EXPO_PUBLIC_TELCOMW_SENDER_ID || 'WGIT',
};
