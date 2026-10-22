const { PRIMARY_API, SECONDARY_API, TIMEOUT_MS } = window.APP_CONFIG;
const message = document.getElementById('message');
const itemsList = document.getElementById('items');
const emptyState = document.getElementById('empty-state');
const form = document.getElementById('item-form');
const submitButton = document.getElementById('submit-button');

function configuredBackends() {
    return [...new Set([PRIMARY_API, SECONDARY_API]
        .map((url) => (typeof url === 'string' ? url.trim().replace(/\/$/, '') : ''))
        .filter(Boolean))];
}

async function apiFetch(path, options = {}) {
    const backends = configuredBackends();
    if (backends.length === 0) {
        throw new Error('Les URL des backends ne sont pas configurées dans config.js.');
    }

    let lastError;
    for (const base of backends) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS || 5000);
        try {
            const response = await fetch(`${base}${path}`, {
                ...options,
                signal: controller.signal,
            });
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.error || `Réponse HTTP ${response.status}`);
            }
            console.info(`API utilisée: ${base}`);
            return await response.json();
        } catch (error) {
            lastError = error;
            console.warn(`Échec sur ${base}: ${error.message}`);
        } finally {
            clearTimeout(timer);
        }
    }

    throw new Error(`Aucun backend disponible. Vérifiez le réseau et les URL configurées. (${lastError?.message || 'erreur inconnue'})`);
}

function showMessage(text, kind = '') {
    message.textContent = text;
    message.className = `message ${kind}`.trim();
}

async function loadItems({ quiet = false } = {}) {
    if (!quiet) {
        emptyState.hidden = false;
        emptyState.textContent = 'Chargement des éléments...';
    }
    try {
        const items = await apiFetch('/api/items');
        itemsList.replaceChildren();
        emptyState.hidden = items.length > 0;
        if (items.length === 0) emptyState.textContent = 'Aucun élément pour le moment.';

        for (const item of items) {
            const row = document.createElement('li');
            const title = document.createElement('strong');
            title.textContent = item.name;
            row.appendChild(title);
            if (item.description) {
                const description = document.createElement('p');
                description.textContent = item.description;
                row.appendChild(description);
            }
            itemsList.appendChild(row);
        }
        if (!quiet) showMessage('Liste actualisée.', 'success');
        return true;
    } catch (error) {
        emptyState.hidden = false;
        emptyState.textContent = 'Impossible de charger les éléments.';
        if (!quiet) showMessage(error.message, 'error');
        return false;
    }
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = 'Envoi...';
    showMessage('Enregistrement en cours...');

    // Keep the same idempotency key for the primary and fallback attempts.
    const item = {
        name: document.getElementById('name').value.trim(),
        description: document.getElementById('description').value.trim(),
        requestId: crypto.randomUUID(),
    };

    try {
        await apiFetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
        });
        form.reset();
        showMessage('Élément ajouté.', 'success');
        await loadItems({ quiet: true });
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Ajouter l’élément';
    }
});

document.getElementById('refresh-button').addEventListener('click', () => loadItems());
loadItems({ quiet: true });
