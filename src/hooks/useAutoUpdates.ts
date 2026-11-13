import { useEffect } from 'react';
import * as Updates from 'expo-updates';

/**
 * Hook to automatically check for and apply EAS Over-The-Air (OTA) updates.
 * In development builds or Expo Go, this safely no-ops.
 * In production release builds, it checks on app launch and reloads seamlessly.
 */
export function useAutoUpdates() {
  useEffect(() => {
    async function checkForUpdates() {
      // expo-updates is active only in standalone release builds
      if (__DEV__ || !Updates.isEnabled) {
        return;
      }

      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          // Reload the app with the newly downloaded JavaScript & assets bundle
          await Updates.reloadAsync();
        }
      } catch (error) {
        // Silently fail if offline ("alibe bundle") or connection times out
        console.log('OTA update check skipped/failed:', error);
      }
    }

    checkForUpdates();
  }, []);
}
