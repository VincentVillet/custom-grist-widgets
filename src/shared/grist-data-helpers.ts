/**
 * Grist table data can be represented in two common formats:
 * 1. Columnar (or column-oriented): { colA: [val1, val2], colB: [val1, val2] }
 *    This is the format returned by `grist.docApi.fetchTable()`.
 * 2. Row-oriented: [{ colA: val1, colB: val1 }, { colA: val2, colB: val2 }]
 *    This format is often easier to work with for iteration and manipulation.
 */

/**
 * Converts data from Grist's columnar format to a row-oriented array of objects.
 * @param columnarData The columnar data object (e.g., from fetchTable).
 * @returns An array of row objects. Returns an empty array if input is empty.
 */
export function columnarToRow(columnarData: Record<string, any[]>): Record<string, any>[] {
  const keys = Object.keys(columnarData);
  if (keys.length === 0) {
    return [];
  }

  // Assume all columns have the same length.
  const numRows = columnarData[keys[0]].length;
  const rows = [];

  for (let i = 0; i < numRows; i++) {
    const row: Record<string, any> = {};
    for (const key of keys) {
      row[key] = columnarData[key][i];
    }
    rows.push(row);
  }

  return rows;
}

/**
 * Converts data from a row-oriented array of objects to Grist's columnar format.
 * This is the format expected by the `BulkAddRecord` action.
 * @param rows An array of row objects.
 * @returns The columnar data object. Returns an empty object if input is empty.
 */
export function rowToColumnar(rows: Record<string, any>[]): Record<string, any[]> {
  const columnarData: Record<string, any[]> = {};
  if (rows.length === 0) {
    return columnarData;
  }

  const keys = Object.keys(rows[0]);
  for (const key of keys) {
    columnarData[key] = [];
  }

  for (const row of rows) {
    for (const key of keys) {
      // Ensure all rows have the same keys, filling with undefined if not.
      columnarData[key].push(row[key]);
    }
  }

  return columnarData;
}
