import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Dynamically read version from package.json
function getVersionFromPackageJson(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packageJsonPath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  } catch (error) {
    return '0.0.0'; // Fallback version
  }
}

export const CURRENT_VERSION = getVersionFromPackageJson();
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
