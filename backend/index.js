require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Schéma + modèle
const Item = mongoose.models.Item || mongoose.model('Item', new mongoose.Schema({
    name: { type: String, required: true, minlength: 2 },
    description: String,
    requestId: { type: String, unique: true, sparse: true }, // anti-doublon
}, { timestamps: true }));

// Connexion à MongoDB avant les routes /api/items
app.use('/api/items', async (req, res, next) => {
    try {
        if (mongoose.connection.readyState !== 1) await mongoose.connect(process.env.MONGODB_URI);
        next();
    } catch (e) {
        res.status(503).json({ error: 'Base de données indisponible' });
    }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/items', async (req, res) => {
    try { res.json(await Item.find().sort({ createdAt: -1 })); }
    catch (e) { res.status(500).json({ error: 'Erreur serveur' }); }
});

app.post('/api/items', async (req, res) => {
    const { name, description, requestId } = req.body || {};
    if (!name || name.trim().length < 2)
        return res.status(400).json({ error: 'Le champ name est requis (min 2 caractères)' });
    try {
        res.status(201).json(await Item.create({ name, description, requestId }));
    } catch (e) {
        if (e.code === 11000) return res.json(await Item.findOne({ requestId })); // retry
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.use((req, res) => res.status(404).json({ error: 'Route introuvable' }));

// Démarrage local / Railway
const PORT = process.env.PORT || 3000;
if (require.main === module) {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => {
            console.log('MongoDB connecté');
            app.listen(PORT, () => console.log('Serveur sur le port ' + PORT));
        })
        .catch((err) => {
            console.error('Erreur MongoDB :', err.message);
            process.exit(1);
        });
}

module.exports = app; // nécessaire pour Vercel