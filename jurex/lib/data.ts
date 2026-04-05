import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const FILES = {
  escrow: "escrow.json",
  tasks: "tasks.json",
  judges: "judges.json",
  "ens-registry": "ens-registry.json",
  cases: "cases.json",
  agents: "agents.json",
} as const;

/**
 * Read JSON file atomically
 */
export function readData<T = any>(fileName: keyof typeof FILES): T {
  try {
    const filePath = path.join(DATA_DIR, FILES[fileName]);
    if (!fs.existsSync(filePath)) {
      return {} as T;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (e) {
    console.error(`Error reading ${fileName}:`, e);
    return {} as T;
  }
}

/**
 * Write JSON file atomically (read-modify-write)
 */
export function writeData<T = any>(
  fileName: keyof typeof FILES,
  data: T
): void {
  try {
    const filePath = path.join(DATA_DIR, FILES[fileName]);
    const tmpPath = filePath + ".tmp";

    // Write to tmp file first
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");

    // Atomic rename
    fs.renameSync(tmpPath, filePath);
  } catch (e) {
    console.error(`Error writing ${fileName}:`, e);
    throw e;
  }
}

/**
 * Update single field in data
 */
export function updateData<T = any>(
  fileName: keyof typeof FILES,
  key: string,
  value: any
): T {
  const data = readData<Record<string, any>>(fileName);
  data[key] = value;
  writeData(fileName, data);
  return data as T;
}

/**
 * Delete single field from data
 */
export function deleteData(fileName: keyof typeof FILES, key: string): void {
  const data = readData<Record<string, any>>(fileName);
  delete data[key];
  writeData(fileName, data);
}

/**
 * Get single entry
 */
export function getEntry<T = any>(
  fileName: keyof typeof FILES,
  key: string
): T | null {
  const data = readData<Record<string, any>>(fileName);
  return data[key] ?? null;
}

/**
 * Get all entries as array
 */
export function getAll<T = any>(fileName: keyof typeof FILES): T[] {
  const data = readData<Record<string, any>>(fileName);
  return Object.values(data) as T[];
}

/**
 * Clear all data in a file
 */
export function clearData(fileName: keyof typeof FILES): void {
  writeData(fileName, {});
}
