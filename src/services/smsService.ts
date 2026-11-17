import { ENV } from '../constants/env';

/**
 * Normalizes any Malawian phone number format into the standard international form without '+'
 * Example:
 *  '0881234567' -> '265881234567'
 *  '+265991234567' -> '265991234567'
 *  '881234567' -> '265881234567'
 */
export function normalizeMalawiPhone(input: string): string {
  let cleaned = input.trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  if (cleaned.startsWith('265')) {
    return cleaned;
  }

  if (cleaned.startsWith('0')) {
    return '265' + cleaned.substring(1);
  }

  if (cleaned.length === 9 && (cleaned.startsWith('8') || cleaned.startsWith('9'))) {
    return '265' + cleaned;
  }

  return cleaned;
}

/**
 * Returns phone formatted as local 10-digit number (e.g. 0881234567)
 */
export function toLocalMalawiPhone(input: string): string {
  const norm = normalizeMalawiPhone(input);
  if (norm.startsWith('265')) {
    return '0' + norm.substring(3);
  }
  return norm;
}

/**
 * Validates whether the number appears to be a valid Malawian mobile number.
 * Typical prefixes: 2658xxxxxxx (TNM) or 2659xxxxxxx (Airtel)
 */
export function isValidMalawiPhone(phone: string): boolean {
  const normalized = normalizeMalawiPhone(phone);
  // Must be 12 digits starting with 265 and then 8 or 9
  return /^265(8|9)\d{8}$/.test(normalized);
}

/**
 * Generates a random 6-digit numeric OTP
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export interface SendSmsResult {
  success: boolean;
  message?: string;
  simulated?: boolean;
}

/**
 * Dispatches an SMS via TelcoMW API
 */
export async function sendOtpViaTelcomw(phone: string, otp: string): Promise<SendSmsResult> {
  const normalized = normalizeMalawiPhone(phone);
  const localNumber = toLocalMalawiPhone(phone);
  const apiKey = ENV.otpSmsApiKey;
  const senderId = ENV.telcomwSenderId || 'Glegder';

  // Normalize base URL: TelcoMW SMS API is hosted at https://telcomw.com
  // (oneclient.telcomw.com is strictly their Payment Gateway portal)
  let baseUrl = (ENV.telcomwBaseUrl || 'https://telcomw.com').replace(/\/$/, '');
  if (baseUrl.includes('oneclient.telcomw.com')) {
    baseUrl = 'https://telcomw.com';
  }

  const messageText = `Your Glegder verification code is: ${otp}. Do not share this code. Valid for 5 minutes.`;

  // Dev simulation if no valid key provided
  if (!apiKey || apiKey === 'YOUR_TELCOMW_API_KEY') {
    console.warn(`[SMS Service] Simulation mode: OTP for ${normalized} is ${otp}`);
    return {
      success: true,
      message: `[Dev Mode] Verification code: ${otp}`,
      simulated: true,
    };
  }

  try {
    // 1. Primary: TelcoMW SMS V3 Broadcast API
    const response = await fetch(`${baseUrl}/api/v3/sms/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to: [localNumber], // TelcoMW accepts local 088... / 099... format
        message: messageText,
        sender_id: senderId,
        skip_invalid: true,
      }),
    });

    if (response.ok) {
      return { success: true };
    }

    // Try with international format if local format was rejected
    const retryIntl = await fetch(`${baseUrl}/api/v3/sms/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to: [normalized],
        message: messageText,
        sender_id: senderId,
        skip_invalid: true,
      }),
    });

    if (retryIntl.ok) {
      return { success: true };
    }

    const errPayload = await response.json().catch(async () => {
      const txt = await response.text().catch(() => '');
      return { message: txt };
    });

    console.warn(`[SMS Service] TelcoMW API returned ${response.status}:`, errPayload);

    const errorDetails = errPayload?.message || `HTTP ${response.status}`;

    // In development mode, allow proceeding with test code so testing isn't blocked
    if (ENV.appEnv === 'development') {
      return {
        success: true,
        message: `TelcoMW API: ${errorDetails}. In dev mode, use OTP: ${otp}`,
        simulated: true,
      };
    }

    return {
      success: false,
      message: `SMS delivery failed (${errorDetails}). Please check your TelcoMW account balance or Sender ID.`,
    };
  } catch (error: any) {
    console.warn(`[SMS Service] Network error sending SMS via TelcoMW:`, error);

    if (ENV.appEnv === 'development') {
      return {
        success: true,
        message: `Network offline/unreachable. Dev fallback OTP: ${otp}`,
        simulated: true,
      };
    }

    return {
      success: false,
      message: `Network error connecting to SMS gateway.`,
    };
  }
}
