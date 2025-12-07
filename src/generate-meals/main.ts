import { columnarToRow, rowToColumnar } from '../shared/grist-data-helpers';

// Ensure Grist API is available
declare const grist: any;

const MEAL_TYPES = ["petit déjeuner", "déjeuner", "snack", "dîner", "consommables"];
const REPAS_TABLE_NAME = 'Repas';

/**
 * Sets up the UI elements and event listeners.
 */
function setupUI() {
  const startDateInput = document.getElementById('start-date') as HTMLInputElement;
  const endDateInput = document.getElementById('end-date') as HTMLInputElement;
  const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
  const statusContainer = document.getElementById('status-container')!;
  const statusMessage = document.getElementById('status-message')!;

  // Set default dates
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  startDateInput.value = today.toISOString().split('T')[0];
  endDateInput.value = nextWeek.toISOString().split('T')[0];

  generateBtn.addEventListener('click', async () => {
    // Use Z to specify UTC and avoid timezone issues with date-only strings
    const startDate = new Date(startDateInput.value + 'T00:00:00Z');
    const endDate = new Date(endDateInput.value + 'T00:00:00Z');

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      showStatus('Veuillez sélectionner une date de début et de fin valide.', true);
      return;
    }
    if (startDate > endDate) {
        showStatus('La date de début doit être avant la date de fin.', true);
        return;
    }

    setLoading(true);

    try {
      await generateMeals(startDate, endDate);
      showStatus('Les repas ont été générés avec succès.', false);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      showStatus(`Erreur: ${errorMessage}`, true);
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading: boolean) {
    generateBtn.disabled = isLoading;
    statusContainer.classList.remove('success', 'error');
    if (isLoading) {
      statusMessage.innerHTML = '<div class="spinner"></div><span>Génération en cours...</span>';
    } else {
      statusMessage.textContent = 'Prêt.';
    }
  }

  function showStatus(message: string, isError: boolean) {
    statusMessage.textContent = message;
    statusContainer.classList.toggle('error', isError);
    statusContainer.classList.toggle('success', !isError);
  }
}

/**
 * Generates meals for the given date range and updates the Grist table.
 * @param startDate The start date (UTC).
 * @param endDate The end date (UTC).
 */
async function generateMeals(startDate: Date, endDate: Date) {
  // 1. Fetch existing records (columnar format)
  const existingRecordsColumnar = await grist.docApi.fetchTable(REPAS_TABLE_NAME);
  const existingRecords = columnarToRow(existingRecordsColumnar);
  
  // 2. Create a lookup for existing Recettes
  const recetteLookup = new Map<string, string>();
  for (const record of existingRecords) {
    // Grist date/datetime values are timestamps in seconds since the UTC epoch.
    if (typeof record.Date === 'number') {
      const recordDate = new Date(record.Date * 1000);
      const dateKey = recordDate.toISOString().split('T')[0];
      const key = `${dateKey}|${record.Type}`;
      recetteLookup.set(key, record.Recette);
    }
  }

  // 3. Generate new rows using UTC dates
  const newRows: any[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dateValue = currentDate.getTime() / 1000; // Timestamp in seconds for Grist

    for (const mealType of MEAL_TYPES) {
      const key = `${dateStr}|${mealType}`;
      const newRow = {
        Date: dateValue,
        Type: mealType,
        Repas: `${dateStr} ${mealType}`,
        Recette: recetteLookup.get(key) || mealType,
      };
      newRows.push(newRow);
    }
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  // 4. Prepare Grist actions to replace data atomically
  const idsToRemove = existingRecords.map((r: any) => r.id);
  const columnsToAdd = rowToColumnar(newRows);

  const actions = [];
  if (idsToRemove.length > 0) {
    actions.push(['BulkRemoveRecord', REPAS_TABLE_NAME, idsToRemove]);
  }
  if (newRows.length > 0) {
    // For BulkAddRecord, rowIds must be an array of nulls for new records
    const rowIds = Array(newRows.length).fill(null);
    actions.push(['BulkAddRecord', REPAS_TABLE_NAME, rowIds, columnsToAdd]);
  }
  
  if (actions.length === 0) {
    return; // Nothing to do
  }

  // 5. Apply actions
  await grist.docApi.applyUserActions(actions);
}

// Initialize the widget
grist.ready();
setupUI();