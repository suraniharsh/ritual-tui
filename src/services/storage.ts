import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { homedir } from 'node:os';
import type { StorageSchema, UserSettings } from '../types/storage';
import type { Task, TaskTree, RecurrenceFrequency } from '../types/task';
import type { TimelineEvent, TimelineEventType } from '../types/timeline';
import { logger } from '../utils/logger';

const getStoragePath = (): string => {
  const home = homedir();
  const platform = process.platform;

  if (platform === 'darwin') {
    return `${home}/Library/Application Support/ritual/data.json`;
  } else if (platform === 'linux') {
    return `${home}/.local/share/ritual/data.json`;
  } else if (platform === 'win32') {
    const appData = process.env.APPDATA || String.raw`${home}\AppData\Roaming`;
    return String.raw`${appData}\ritual\data.json`;
  }

  return `${home}/.ritual/data.json`;
};

const getDefaultSchema = (): StorageSchema => ({
  version: '1.0.0',
  tasks: {},
  timeline: {},
  settings: {
    theme: 'dark',
    defaultStartTime: 'now',
    dateFormat: 'MMMM do, yyyy',
    timeFormat: '12h',
    autoMoveUnfinishedTasks: true,
  },
});

interface RawRecurrencePattern {
  frequency: string;
  interval?: number;
  daysOfWeek?: number[];
  endDate?: string;
  excludedDates?: string[];
}

interface RawTask {
  id: string;
  title: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  startTime?: string;
  endTime?: string;
  children: RawTask[];
  parentId?: string;
  date: string;
  recurrence?: RawRecurrencePattern;
  isRecurringInstance?: boolean;
  recurringParentId?: string;
}

interface RawEvent {
  id: string;
  taskId: string;
  taskTitle: string;
  type: string;
  timestamp: string;
  previousState?: string;
  newState?: string;
}

export interface RawSchema {
  version: string;
  tasks: { [date: string]: RawTask[] };
  timeline: { [date: string]: RawEvent[] };
  settings: UserSettings;
}

export class StorageService {
  private readonly filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath || getStoragePath();
  }

  async load(): Promise<StorageSchema> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(data) as RawSchema;

      // Convert date strings back to Date objects
      return this.hydrateDates(parsed);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return getDefaultSchema();
      }
      logger.log('Failed to load storage', { error: String(error) });
      return getDefaultSchema();
    }
  }

  async save(data: StorageSchema): Promise<void> {
    try {
      const dir = dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });

      // Convert Date objects to ISO strings for JSON serialization
      const serialized = this.serializeDates(data);
      await fs.writeFile(this.filePath, JSON.stringify(serialized, null, 2), 'utf-8');
    } catch (error) {
      logger.log('Failed to save storage', { error: String(error) });
    }
  }

  async backup(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replaceAll(':', '-');
      const backupPath = `${this.filePath}.backup-${timestamp}`;
      const data = await fs.readFile(this.filePath, 'utf-8');
      await fs.writeFile(backupPath, data, 'utf-8');
    } catch (error) {
      logger.log('Failed to backup storage', { error: String(error) });
    }
  }

  getStoragePath(): string {
    return this.filePath;
  }

  // Remove duplicate IDs and tasks that are leaked children (have parentId set at top level)
  private deduplicateTopLevel(tasks: Task[]): Task[] {
    const seen = new Set<string>();
    return tasks.filter((task) => {
      if (seen.has(task.id) || task.parentId) return false;
      seen.add(task.id);
      return true;
    });
  }

  public hydrateDates(data: RawSchema): StorageSchema {
    const tasks: TaskTree = {};
    if (data.tasks) {
      for (const date of Object.keys(data.tasks)) {
        tasks[date] = this.deduplicateTopLevel(
          data.tasks[date].map((task) => this.hydrateTask(task)),
        );
      }
    }

    const timeline: { [date: string]: TimelineEvent[] } = {};
    if (data.timeline) {
      for (const date of Object.keys(data.timeline)) {
        timeline[date] = data.timeline[date].map((event) => ({
          ...event,
          type: event.type as TimelineEventType,
          timestamp: new Date(event.timestamp),
          previousState: event.previousState as TimelineEvent['previousState'],
          newState: event.newState as TimelineEvent['newState'],
        }));
      }
    }

    return { ...data, tasks, timeline };
  }

  private hydrateTask(task: RawTask): Task {
    return {
      id: task.id,
      title: task.title,
      state: task.state as Task['state'],
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      startTime: task.startTime ? new Date(task.startTime) : undefined,
      endTime: task.endTime ? new Date(task.endTime) : undefined,
      children: task.children ? task.children.map((child) => this.hydrateTask(child)) : [],
      parentId: task.parentId,
      date: task.date,
      recurrence: task.recurrence
        ? {
            ...task.recurrence,
            frequency: task.recurrence.frequency as RecurrenceFrequency,
            endDate: task.recurrence.endDate ? new Date(task.recurrence.endDate) : undefined,
          }
        : undefined,
      isRecurringInstance: task.isRecurringInstance,
      recurringParentId: task.recurringParentId,
    };
  }

  private serializeDates(data: StorageSchema): RawSchema {
    const tasks: { [date: string]: RawTask[] } = {};
    for (const date of Object.keys(data.tasks)) {
      tasks[date] = this.deduplicateTopLevel(data.tasks[date]).map((task) =>
        this.serializeTask(task),
      );
    }

    const timeline: { [date: string]: RawEvent[] } = {};
    for (const date of Object.keys(data.timeline)) {
      timeline[date] = data.timeline[date].map((event) => ({
        ...event,
        timestamp: event.timestamp.toISOString(),
      }));
    }

    return { ...data, tasks, timeline };
  }

  private serializeTask(task: Task): RawTask {
    return {
      id: task.id,
      title: task.title,
      state: task.state,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      startTime: task.startTime ? task.startTime.toISOString() : undefined,
      endTime: task.endTime ? task.endTime.toISOString() : undefined,
      children: task.children ? task.children.map((child) => this.serializeTask(child)) : [],
      parentId: task.parentId,
      date: task.date,
      recurrence: task.recurrence
        ? {
            ...task.recurrence,
            endDate: task.recurrence.endDate ? task.recurrence.endDate.toISOString() : undefined,
          }
        : undefined,
      isRecurringInstance: task.isRecurringInstance,
      recurringParentId: task.recurringParentId,
    };
  }
}

export const storageService = new StorageService();
