require('dotenv').config();

const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5500,http://127.0.0.1:5500')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        // Requests without an Origin header include curl and server-to-server calls.
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Origine CORS non autorisée'));
    },
}));
app.use(express.json({ limit: '32kb' }));

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true, minlength: 2, trim: true },
    description: { type: String, trim: true, default: '' },
    // A client-generated key makes retries safe when both backends share this database.
    requestId: { type: String, unique: true, sparse: true, trim: true },
}, { timestamps: true });

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);
let connectionPromise;

async function connectDatabase() {
    if (mongoose.connection.readyState === 1) return;
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not configured');
    }
    if (!connectionPromise) {
        connectionPromise = mongoose.connect(process.env.MONGODB_URI)
            .catch((error) => {
                connectionPromise = undefined;
                throw error;
            });
    }
    await connectionPromise;
}

app.get('/', (_req, res) => {
    res.type('text/plain; charset=utf-8').send('Badr Nachid - Côté backend');
});

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'mern-badr-nachid' });
});

app.get('/api/items', async (_req, res) => {
    try {
        await connectDatabase();
        const items = await Item.find().sort({ createdAt: -1 }).lean();
        res.json(items);
    } catch (error) {
        console.error('GET /api/items failed:', error.message);
        res.status(503).json({ error: 'Base de données indisponible' });
    }
});

app.post('/api/items', async (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    const requestId = typeof req.body?.requestId === 'string' ? req.body.requestId.trim() : '';

    if (name.length < 2 || name.length > 120) {
        return res.status(400).json({ error: 'Le nom est requis (2 à 120 caractères).' });
    }
    if (description.length > 500) {
        return res.status(400).json({ error: 'La description ne peut pas dépasser 500 caractères.' });
    }
    if (requestId.length > 100) {
        return res.status(400).json({ error: 'Identifiant de requête invalide.' });
    }

    try {
        await connectDatabase();
        const item = await Item.create({ name, description, ...(requestId ? { requestId } : {}) });
        return res.status(201).json(item);
    } catch (error) {
        if (error.code === 11000 && requestId) {
            const existing = await Item.findOne({ requestId }).lean();
            if (existing) return res.status(200).json(existing);
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Les données de l’élément sont invalides.' });
        }
        console.error('POST /api/items failed:', error.message);
        return res.status(503).json({ error: 'Base de données indisponible' });
    }
});

app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'JSON invalide.' });
    }
    if (error.message === 'Origine CORS non autorisée') {
        return res.status(403).json({ error: error.message });
    }
    console.error('Request failed:', error.message);
    return res.status(500).json({ error: 'Erreur serveur.' });
});

app.use((_req, res) => res.status(404).json({ error: 'Route introuvable.' }));

const PORT = process.env.PORT || 3000;
if (require.main === module) {
    connectDatabase()
        .then(() => {
            console.log('MongoDB connected');
            app.listen(PORT, () => console.log(`API prête sur le port ${PORT}`));
        })
        .catch((error) => {
            console.error(`Connexion MongoDB échouée (${error.name}). Vérifiez MONGODB_URI et l'accès réseau Atlas.`);
            process.exit(1);
        });
}

module.exports = app;
