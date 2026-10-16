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
 * 
 * Rules:
 * 1. Must inspect ALL existing records (not simply row count, since deleted records or imports create gaps).
 * 2. E.g. AHM-001, AHM-002, AHM-004 -> Max number is 4 -> Next MUST be AHM-005.
 * 3. E.g. AHM-099 -> Next is AHM-100.
 * 4. Maintains same prefix and digit padding (minimum 3 digits).
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

  // If no numeric IDs found, start with default prefix
  if (maxNum === 0) {
    const defaultPrefix = detectedPrefix || getDefaultPrefixForLocation(locationName);
    return `${defaultPrefix}001`;
  }

  const nextNum = maxNum + 1;
  // Pad with leading zeros (e.g. 005, 099 -> 100)
  const padded = String(nextNum).padStart(detectedDigits, '0');
  return `${detectedPrefix}${padded}`;
}

/**
 * Checks if a given Performa ID already exists in the records list.
 * If editing an existing record, pass currentRecordOriginalId to ignore self.
 */
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
