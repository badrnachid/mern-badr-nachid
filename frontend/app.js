const { PRIMARY_API, SECONDARY_API, TIMEOUT_MS } = window.APP_CONFIG;
const msg = document.getElementById('message');
const list = document.getElementById('items');

async function apiFetch(path, options = {}) {
    const bases = [PRIMARY_API, SECONDARY_API];
    let lastError;
    for (const base of bases) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
            const res = await fetch(base + path, { ...options, signal: controller.signal });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return await res.json();
        } catch (err) {
            lastError = err;
            console.warn('Échec sur ' + base + ' : ' + err.message);
        } finally {
            clearTimeout(timer);
        }
    }
    throw new Error('Aucun serveur disponible. Réessayez plus tard. (' + lastError.message + ')');
}

async function loadItems() {
    try {
        const items = await apiFetch('/api/items');
        list.innerHTML = '';
        items.forEach(i => {
            const li = document.createElement('li');
            li.textContent = i.name + (i.description ? ' - ' + i.description : '');
            list.appendChild(li);
        });
        msg.textContent = ''; msg.className = '';
    } catch (e) { msg.textContent = e.message; msg.className = 'error'; }
}

document.getElementById('item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        name: document.getElementById('name').value,
        description: document.getElementById('description').value,
        requestId: crypto.randomUUID(),
    };
    try {
        await apiFetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        e.target.reset();
        loadItems();
    } catch (err) { msg.textContent = err.message; msg.className = 'error'; }
});

loadItems();