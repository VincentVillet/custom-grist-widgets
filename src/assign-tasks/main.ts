import { columnarToRow } from '../shared/grist-data-helpers';

// Ensure Grist API is available
declare const grist: any;

const REPAS_TABLE_NAME = 'Repas';
const PERSONNES_TABLE_NAME = 'Personnes';

/**
 * Sets up the UI elements and event listeners.
 */
function setupUI() {
  const assignBtn = document.getElementById('assign-btn') as HTMLButtonElement;
  const statusContainer = document.getElementById('status-container')!;
  const statusMessage = document.getElementById('status-message')!;

  assignBtn.addEventListener('click', async () => {
    setLoading(true);
    try {
      await assignTasks();
      showStatus('Les tâches ont été assignées avec succès.', false);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      showStatus(`Erreur: ${errorMessage}`, true);
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading: boolean) {
    assignBtn.disabled = isLoading;
    statusContainer.classList.remove('success', 'error');
    if (isLoading) {
      statusMessage.innerHTML = '<div class="spinner"></div><span>Assignation en cours...</span>';
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
 * Main logic for assigning tasks.
 */
async function assignTasks() {
  // 1. Fetch all necessary data from Grist
  const [repasData, personnesData] = await Promise.all([
    grist.docApi.fetchTable(REPAS_TABLE_NAME),
    grist.docApi.fetchTable(PERSONNES_TABLE_NAME),
  ]);

  // 2. Convert to a more usable format and create lookups
  const allRepas = columnarToRow(repasData);
  const allPersonnes = columnarToRow(personnesData);

  const personnesMap = new Map(allPersonnes.map(p => [p.id, p]));
  
  // 3. Initialize task counts for each person based on current assignments in Grist
  const assignedTasksCount = new Map<number, number>();
  allPersonnes.forEach(p => {
    // The 'Repas' column on 'Personnes' is a ReferenceList of tasks they are assigned to.
    const existingTasks = (p.Repas as any[])?.length > 1 ? (p.Repas as any[]).length - 1 : 0;
    assignedTasksCount.set(p.id, existingTasks);
  });

  const userActions: any[] = [];

  // 4. Iterate over each meal to assign tasks
  for (const repas of allRepas) {
    const numRequired = repas.Nb_taches || 0;
    // Grist ReferenceList is an array like ['L', id1, id2, ...]. Length is (list.length - 1)
    const currentAssignees = (repas.Responsables as any[])?.slice(1) || [];
    let numToAssign = numRequired - currentAssignees.length;

    if (numToAssign <= 0) {
      continue;
    }

    // Identify potential candidates: present people not already assigned
    const presentPersonIds = (repas.Personnes_presentes as any[])?.slice(1) || [];
    const candidateIds = presentPersonIds.filter((id: number) => !currentAssignees.includes(id));

    if (candidateIds.length < numToAssign) {
      throw new Error(`Pas assez de personnes disponibles pour la tâche "${repas.Repas}" (besoin de ${numToAssign}, ${candidateIds.length} disponibles).`);
    }

    const newlyAssignedToThisRepas: number[] = [];

    // 5. Assignment loop: select people one by one
    while (numToAssign > 0) {
      let bestCandidateId = -1;
      let minScore = Infinity;

      // Find the candidate with the lowest score
      for (const candidateId of candidateIds) {
        if (newlyAssignedToThisRepas.includes(candidateId)) continue; // Don't assign the same person twice to the same task

        const person = personnesMap.get(candidateId);
        if (!person) continue;

        const stayDuration = person.Nb_jours_sejour || 1; // Avoid division by zero
        if (stayDuration <= 0) continue;

        const outsideTasks = person.Nb_taches_hors_grist || 0;
        const currentTasks = assignedTasksCount.get(candidateId) || 0;
        
        const score = (outsideTasks + currentTasks) / stayDuration;

        if (score < minScore) {
          minScore = score;
          bestCandidateId = candidateId;
        }
      }

      if (bestCandidateId !== -1) {
        newlyAssignedToThisRepas.push(bestCandidateId);
        // Increment the task count for the selected person for the next scoring
        assignedTasksCount.set(bestCandidateId, (assignedTasksCount.get(bestCandidateId) || 0) + 1);
        numToAssign--;
      } else {
        // Should not happen if there are enough candidates
        break; 
      }
    }

    // 6. Prepare the update action for this "Repas"
    if (newlyAssignedToThisRepas.length > 0) {
      const updatedAssignees = ['L', ...currentAssignees, ...newlyAssignedToThisRepas];
      userActions.push(['UpdateRecord', REPAS_TABLE_NAME, repas.id, { Responsables: updatedAssignees }]);
    }
  }

  // 7. Apply all updates in a single transaction
  if (userActions.length > 0) {
    await grist.docApi.applyUserActions(userActions);
  }
}

// Initialize the widget
grist.ready();
setupUI();
