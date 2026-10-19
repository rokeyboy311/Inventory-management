import { PerformaRecord } from '../types/performa';

/**
 * Extracts the prefix and numeric value from a Performa ID.
 * Examples:
 *  "AHM-004" -> { prefix: "AHM-", num: 4, digits: 3 }
 *  "TR-15"    -> { prefix: "TR-", num: 15, digits: 2 }
 *  "102"      -> { prefix: "", num: 102, digits: 3 }
 */
export function parsePerformaId(id: string): { prefix: string; num: number; digits: number } | null {
  if (!id) return null;
  const match = id.trim().match(/^(.*?)(\d+)$/);
  if (!match) return null;
  const prefix = match[1] || '';
  const numStr = match[2];
  const num = parseInt(numStr, 10);
  return {
    prefix,
    num,
    digits: numStr.length
  };
}

/**
 * Generates the default prefix from a location name.
 * E.g., "Ahmedabad" -> "AHM-"
 *       "Vadodara" -> "VAD-"
 *       "Rio: Vauxia" -> "RIO-"
 */
export function getDefaultPrefixForLocation(location: string): string {
  if (!location) return 'TC-';
  const clean = location.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (clean.length >= 3) {
    return clean.slice(0, 3) + '-';
  }
  return (clean || 'TC') + '-';
}

/**
 * Automatically inspects ALL existing records in the dataset to determine
 * the NEXT consecutive Performa ID.
 */
export function getNextPerformaId(
  existingPerformas: PerformaRecord[],
  locationName: string = 'Ahmedabad'
): string {
  if (!existingPerformas || existingPerformas.length === 0) {
    const defaultPrefix = getDefaultPrefixForLocation(locationName);
    return `${defaultPrefix}001`;
  }

  let maxNum = 0;
  let detectedPrefix = '';
  let detectedDigits = 3;

  for (const record of existingPerformas) {
    const parsed = parsePerformaId(record.id);
    if (parsed) {
      if (parsed.num > maxNum) {
        maxNum = parsed.num;
        detectedPrefix = parsed.prefix;
        detectedDigits = Math.max(parsed.digits, 3);
      } else if (!detectedPrefix && parsed.prefix) {
        detectedPrefix = parsed.prefix;
      }
    }
  }

  if (maxNum === 0) {
    const defaultPrefix = detectedPrefix || getDefaultPrefixForLocation(locationName);
    return `${defaultPrefix}001`;
  }

  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(detectedDigits, '0');
  return `${detectedPrefix}${padded}`;
}

/**
 * Checks if a given Performa ID already exists in the records list.
 * Supports both exact match (e.g., "DOL-002") and numeric match (e.g., typing "2" or "002" matches "DOL-002").
 */
export function findMatchingPerforma(
  inputId: string,
  existingPerformas: PerformaRecord[]
): PerformaRecord | null {
  const trimmed = (inputId || '').trim();
  if (!trimmed || !existingPerformas || existingPerformas.length === 0) return null;

  const lower = trimmed.toLowerCase();

  // 1. Exact ID match (case-insensitive)
  const exact = existingPerformas.find(p => p.id.trim().toLowerCase() === lower);
  if (exact) return exact;

  // 2. Numeric suffix match if user types just a number like "1" or "002" or "DOL-2"
  const parsedInput = parsePerformaId(trimmed);
  if (parsedInput) {
    const numericMatch = existingPerformas.find(p => {
      const parsedRecord = parsePerformaId(p.id);
      if (!parsedRecord) return false;
      // If user typed only digits (no prefix), match by number
      if (!parsedInput.prefix) {
        return parsedRecord.num === parsedInput.num;
      }
      // If user typed prefix + number (e.g. DOL-2 vs DOL-002), match prefix & number
      return (
        parsedRecord.prefix.toLowerCase() === parsedInput.prefix.toLowerCase() &&
        parsedRecord.num === parsedInput.num
      );
    });
    if (numericMatch) return numericMatch;
  }

  return null;
}

/**
 * Formats a shorthand numeric input (like "5") into the canonical prefixed ID (like "DOL-005").
 */
export function normalizePerformaIdInput(
  rawId: string,
  existingPerformas: PerformaRecord[],
  locationName: string = 'Dolvan'
): string {
  const trimmed = (rawId || '').trim();
  if (!trimmed) return '';

  // If user typed only digits (e.g., "5" or "12"), auto-prefix with workbook prefix
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    let prefix = getDefaultPrefixForLocation(locationName);
    let digits = 3;
    for (const r of existingPerformas) {
      const p = parsePerformaId(r.id);
      if (p && p.prefix) {
        prefix = p.prefix;
        digits = Math.max(p.digits, 3);
        break;
      }
    }
    return `${prefix}${String(num).padStart(digits, '0')}`;
  }

  return trimmed.toUpperCase();
}

/**
 * Sorts performas in ascending numerical order of their Performa ID so that
 * when a new Performa ID (e.g., DOL-002) is added, it automatically goes to its
 * exact row position in the Excel sheet (between DOL-001 and DOL-003).
 */
export function sortPerformasBySequence(performas: PerformaRecord[]): PerformaRecord[] {
  return [...performas].sort((a, b) => {
    const pa = parsePerformaId(a.id);
    const pb = parsePerformaId(b.id);
    if (pa && pb) {
      if (pa.prefix.toLowerCase() === pb.prefix.toLowerCase()) {
        return pa.num - pb.num;
      }
      if (pa.num !== pb.num) {
        return pa.num - pb.num;
      }
    }
    return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
  });
}

export function checkDuplicatePerformaId(
  id: string,
  existingPerformas: PerformaRecord[],
  currentRecordOriginalId?: string
): boolean {
  const normalized = id.trim().toLowerCase();
  return existingPerformas.some(p => {
    if (currentRecordOriginalId && p.id.trim().toLowerCase() === currentRecordOriginalId.trim().toLowerCase()) {
      return false; // ignore self
    }
    return p.id.trim().toLowerCase() === normalized;
  });
}
