# Grist DocActions Guide

This document provides a user-friendly guide to using Grist's powerful but sparsely documented `docApi.applyUserActions` function from within a custom widget.

## Overview

The `grist.docApi.applyUserActions(actions)` function is the primary method for making changes to a Grist document. It takes a single argument: an array of individual actions to be performed.

`actions`: An array, where each element is a `DocAction`. For example `[['AddRecord', ...], ['RemoveRecord', ...]]`.

By bundling multiple actions into a single call, you can make complex changes atomically and efficiently, minimizing API overhead.

## Data Structures

Before diving into actions, it's important to understand the two ways Grist organizes data:

1.  **Row-Oriented (`ColValues`):** This is an object representing a single row, where keys are column IDs.
    ```typescript
    // e.g., for AddRecord or UpdateRecord
    const rowObject = { ColA: "value1", ColB: 100 };
    ```

2.  **Column-Oriented (`BulkColValues`):** This is an object where keys are column IDs, but the values are *arrays* of cell values for that entire column. This format is used by all `Bulk...` actions.
    ```typescript
    // e.g., for BulkAddRecord
    const columnData = {
      ColA: ["value1", "value2", "value3"],
      ColB: [100, 200, 300]
    };
    ```

---

## Common Actions

Below are the formats for the most common record-manipulation actions.

### `BulkRemoveRecord` (Recommended for Deleting)

Atomically removes multiple rows from a table. This is the most efficient way to delete data.

*   **Format**: `['BulkRemoveRecord', tableId, rowIds]`
*   `tableId` (string): The ID of the table to modify (e.g., `'My_Table'`).
*   `rowIds` (number[]): An array of the integer `id`s of the rows to be deleted.

**Example:**
```typescript
const idsToDelete = [1, 5, 12];
const action = ['BulkRemoveRecord', 'Invoices', idsToDelete];
await grist.docApi.applyUserActions([action]);
```

### `BulkAddRecord` (Recommended for Adding)

Atomically adds multiple new rows to a table. This is the most efficient way to insert data.

*   **Format**: `['BulkAddRecord', tableId, newRowIds, bulkColValues]`
*   `tableId` (string): The ID of the table to modify.
*   `newRowIds` (any[]): An array of placeholders for the new row IDs. To let Grist generate IDs for you, this must be an array of `null`s, with one `null` for each new row being added. E.g., `[null, null, null]` for three new rows.
*   `bulkColValues` (`BulkColValues`): A column-oriented object containing the data for the new rows.

**Example:**
```typescript
const rowsToAdd = 3;
const action = [
  'BulkAddRecord',
  'Invoices',
  Array(rowsToAdd).fill(null), // [null, null, null]
  {
    Invoice_Date: ['2023-01-15', '2023-01-16', '2023-01-17'],
    Amount: [150, 220, 95],
    Client: ["Client A", "Client B", "Client A"]
  }
];
await grist.docApi.applyUserActions([action]);
```

### `ReplaceTableData`

Atomically replaces all data in a table. This is equivalent to a `BulkRemoveRecord` of all rows followed by a `BulkAddRecord`.

*   **Format**: `['ReplaceTableData', tableId, newRowIds, bulkColValues]`
*   The arguments are identical to `BulkAddRecord`. It implicitly handles deleting all existing data first.

---
### Single-Record Actions (For Reference)

These are less efficient for multiple records but are simpler for single-row operations.

#### `RemoveRecord`
*   **Format**: `['RemoveRecord', tableId, rowId]`
*   `rowId` (number): The ID of the single row to remove.

#### `AddRecord`
*   **Format**: `['AddRecord', tableId, newRowId, colValues]`
*   `newRowId` (any): Should be `null` to let Grist generate a new ID.
*   `colValues` (`ColValues`): A row-oriented object for the single new row.
