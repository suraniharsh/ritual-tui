// @ts-ignore - JSON import
import packageJson from '../../package.json' assert { type: 'json' };

export const CURRENT_VERSION = packageJson.version;
export const PACKAGE_NAME = 'ritual-tui';

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
}

export async function checkForUpdate(): Promise<UpdateInfo> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${PACKAGE_NAME}/latest`);
    const data = (await res.json()) as { version: string };
    const latestVersion = data.version;

    return {
      hasUpdate: latestVersion !== CURRENT_VERSION,
      currentVersion: CURRENT_VERSION,
      latestVersion,
    };
  } catch {
    return {
      hasUpdate: false,
      currentVersion: CURRENT_VERSION,
      latestVersion: CURRENT_VERSION,
    };
  }
}
