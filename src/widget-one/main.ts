import 'grist-plugin-api';

// A helper function to update the UI with status messages.
function setStatus(message: string, isProcessing: boolean = false) {
  const statusContainer = document.getElementById('status-container');
  const statusMessage = document.getElementById('status-message');
  if (!statusContainer || !statusMessage) { return; }

  // Resets any previous 'success' styling
  statusContainer.classList.remove('success');

  // Set the message
  statusMessage.textContent = message;

  // Handle the spinner display
  const existingSpinner = statusContainer.querySelector('.spinner');
  if (isProcessing && !existingSpinner) {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    statusContainer.appendChild(spinner);
  } else if (!isProcessing && existingSpinner) {
    existingSpinner.remove();
  }
}

// A helper to flash the success message.
function flashSuccess() {
    const statusContainer = document.getElementById('status-container');
    if (statusContainer) {
        statusContainer.classList.add('success');
        // Optional: Reset to default state after a few seconds
        setTimeout(() => {
          setStatus('Prêt.');
          statusContainer.classList.remove('success');
        }, 4000);
    }
}

async function updatePresencesTable(inputData: any[]) {
  setStatus('Changement détecté...', true);

  try {
    // If there's no input, wipe the table.
    if (!inputData || inputData.length === 0) {
      setStatus('Données sources vides, nettoyage des présences...', true);
      const allOldRecords = await grist.docApi.fetchTable('Presences');
      if (allOldRecords.length > 0) {
        const idsToRemove = allOldRecords.map(r => r.id);
        await grist.docApi.applyUserActions([
          ['BulkRemoveRecord', 'Presences', idsToRemove]
        ]);
      }
      setStatus('Présences nettoyées.', false);
      flashSuccess();
      return;
    }

    setStatus('Recalcul des présences...', true);

    // --- 1. Calculate the new rows (row-oriented) ---
    const processedData = inputData.map(r => ({
      Date_arrivee: r.Date_arrivee,
      Date_depart: r.Date_depart,
      Personne: r.Personne,
    }));

    const validArrivals = processedData.filter(r => r.Date_arrivee instanceof Date).map(r => r.Date_arrivee.getTime());
    const validDepartures = processedData.filter(r => r.Date_depart instanceof Date).map(r => r.Date_depart.getTime());

    if (validArrivals.length === 0 || validDepartures.length === 0) {
      setStatus('Aucune date valide dans les données sources.', false);
      return;
    }

    const minDate = new Date(Math.min(...validArrivals));
    const maxDate = new Date(Math.max(...validDepartures));
    minDate.setUTCHours(0, 0, 0, 0);
    maxDate.setUTCHours(0, 0, 0, 0);

    const repasList = ["petit déjeuner", "déjeuner", "apéro", "dîner"];
    const rows: { Date: string, Repas: string, Personne: any, Presence: number }[] = [];
    let currentDate = new Date(minDate.getTime());

    while (currentDate.getTime() <= maxDate.getTime()) {
      for (const repas of repasList) {
        for (const person of processedData) {
          if (!(person.Date_arrivee instanceof Date) || !(person.Date_depart instanceof Date)) continue;
          
          const arr = new Date(person.Date_arrivee.getTime());
          arr.setUTCHours(0, 0, 0, 0);
          const dep = new Date(person.Date_depart.getTime());
          dep.setUTCHours(0, 0, 0, 0);

          let presence = 0;
          const currentTs = currentDate.getTime();
          const arrTs = arr.getTime();
          const depTs = dep.getTime();

          if (currentTs > arrTs && currentTs < depTs) presence = 1;
          else if (currentTs === arrTs && ["apéro", "dîner"].includes(repas)) presence = 1;
          else if (currentTs === depTs && repas === "petit déjeuner") presence = 1;
          
          rows.push({
            Date: currentDate.toISOString().substring(0, 10),
            Repas: repas,
            Personne: person.Personne,
            Presence: presence
          });
        }
      }
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    // --- 2. Wipe and rebuild the 'Presences' table ---
    // Transform the row-oriented `rows` array into a column-oriented `BulkColValues` object.
  const bulkColValues: { [key: string]: any[] } = { Date: [], Repas: [], Personne: [], Presence: [] };
  for (const row of rows) {
    bulkColValues.Date.push(row.Date);
    bulkColValues.Repas.push(row.Repas);
    bulkColValues.Personne.push(row.Personne);
    bulkColValues.Presence.push(row.Presence);
  }

  // Create one ReplaceTableData action.
  const newRowIds = Array(rows.length).fill(null);
  const bulkReplaceAction = ['ReplaceTableData', 'Presences', newRowIds, bulkColValues];
  
  // Combine both bulk actions into a single API call to wipe and rebuild the table.
  await grist.docApi.applyUserActions([bulkReplaceAction]);

    setStatus('Présences mises à jour.', false);
    flashSuccess();

  } catch (err) {
    console.error("Presence Widget Error:", err);
    setStatus(`Erreur: ${err.message}`, false);
  }
}

// Register the function to run when the source data changes.
grist.ready();
grist.onRecords(updatePresencesTable);
