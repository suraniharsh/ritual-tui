import { storageService } from './services/storage';
import { StorageSchema } from './types/storage';
import readline from 'readline';

const SERVER_URL = process.env.RITUAL_SERVER_URL;
const FETCH_TIMEOUT_MS = 10_000;

interface ExportResult {
  code: string;
  expiresAt: string;
}

interface ImportResult {
  data: StorageSchema;
}

interface ApiError {
  message?: string;
}

export async function handleCli(args: string[]) {
  const command = args[0];

  if (command === 'export') {
    await handleExport();
  } else if (command === 'import') {
    await handleImport();
  } else {
    console.error('Unknown command');
    process.exit(1);
  }
}

function requireServerUrl(): string {
  if (!SERVER_URL) {
    console.error('Error: RITUAL_SERVER_URL environment variable is not set.');
    console.error('Add it to your .env file: RITUAL_SERVER_URL=https://your-server.com');
    process.exit(1);
  }
  return SERVER_URL;
}

async function handleExport() {
  const serverUrl = requireServerUrl();

  try {
    const data = await storageService.load();

    const response = await fetch(`${serverUrl}/api/data/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw new Error(error.message || 'Export failed');
    }

    const result = (await response.json()) as ExportResult;
    console.log('\nData exported successfully!');
    console.log('---------------------------');
    console.log(`Secret Key: ${result.code}`);
    console.log(`Expires: ${new Date(result.expiresAt).toLocaleString()}`);
    console.log('---------------------------\n');
    console.log(`Run 'ritual import' on another machine and enter this key to sync your data.\n`);
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.error('Export failed: server did not respond within 10 seconds.');
    } else {
      console.error('Export failed:', error);
    }
    process.exit(1);
  }
}

async function handleImport() {
  const serverUrl = requireServerUrl();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => rl.question(query, resolve));
  };

  try {
    const code = (await question('Enter your secret key: ')).trim();

    if (!code) {
      console.error('Error: secret key cannot be empty.');
      return;
    }

    const response = await fetch(`${serverUrl}/api/data/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw new Error(error.message || 'Import failed');
    }

    const json = (await response.json()) as ImportResult;
    const hydratedRemoteData = storageService.hydrateDates(json.data);

    const action = (
      await question(
        '\nData found! Do you want to (r)eplace existing data or (m)erge with it? [r/m]: ',
      )
    )
      .trim()
      .toLowerCase();

    if (action === 'r') {
      await storageService.save(hydratedRemoteData);
      console.log('Data successfully replaced.');
    } else if (action === 'm') {
      const currentData = await storageService.load();
      const mergedData = mergeData(currentData, hydratedRemoteData);
      await storageService.save(mergedData);
      console.log('Data successfully merged.');
    } else {
      console.log('Cancelled.');
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.error('Import failed: server did not respond within 10 seconds.');
    } else {
      console.error('Import failed:', error);
    }
  } finally {
    rl.close();
  }
}

function mergeData(local: StorageSchema, remote: StorageSchema): StorageSchema {
  const merged: StorageSchema = { ...local };

  Object.keys(remote.tasks).forEach((date) => {
    if (!merged.tasks[date]) {
      merged.tasks[date] = remote.tasks[date];
    } else {
      const existingIds = new Set(merged.tasks[date].map((t) => t.id));
      const newTasks = remote.tasks[date].filter((t) => !existingIds.has(t.id));
      merged.tasks[date] = [...merged.tasks[date], ...newTasks];
    }
  });

  Object.keys(remote.timeline).forEach((date) => {
    if (!merged.timeline[date]) {
      merged.timeline[date] = remote.timeline[date];
    } else {
      const existingIds = new Set(merged.timeline[date].map((e) => e.id));
      const newEvents = remote.timeline[date].filter((e) => !existingIds.has(e.id));
      merged.timeline[date] = [...merged.timeline[date], ...newEvents];
    }
  });

  return merged;
}
