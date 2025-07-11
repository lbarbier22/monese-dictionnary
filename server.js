const express = require('express');
const path = require('path');
const fs = require('fs');
const mots = require('./ressources/rare_words.json');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'vues'));
app.use(express.static(path.join(__dirname, 'public')));

// Fichier pour stocker les favoris des utilisateurs
const FAVORIS_FILE = path.join(__dirname, 'data', 'favoris.json');

// Créer le dossier data s'il n'existe pas
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Initialiser le fichier favoris s'il n'existe pas
if (!fs.existsSync(FAVORIS_FILE)) {
    fs.writeFileSync(FAVORIS_FILE, JSON.stringify({}));
}

// Fonctions utilitaires pour gérer les favoris
function getFavorisData() {
    try {
        const data = fs.readFileSync(FAVORIS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

function saveFavorisData(data) {
    fs.writeFileSync(FAVORIS_FILE, JSON.stringify(data, null, 2));
}

function getUserId(req) {
    // Utiliser l'IP comme identifiant temporaire (en production, utiliser une vraie authentification)
    return req.ip || req.connection.remoteAddress || 'anonymous';
}

function getTopFavoris() {
    const favorisData = getFavorisData();
    const motCounts = {};
    
    // Compter les favoris pour chaque mot
    Object.values(favorisData).forEach(userFavoris => {
        userFavoris.forEach(favori => {
            const mot = favori.mot || favori; // Compatibilité ancien/nouveau format
            motCounts[mot] = (motCounts[mot] || 0) + 1;
        });
    });
    
    // Trier par nombre de favoris et prendre le top 10
    return Object.entries(motCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([mot, count]) => ({ mot, count }));
}

app.get('/', (req, res) => {
    const mot = mots[Math.floor(Math.random() * mots.length)];
    res.redirect(`/mots/${encodeURIComponent(mot.Mot)}`);
});

app.get('/liste', (req, res) => {
    const motsTries = [...mots].sort((a, b) => a.Mot.localeCompare(b.Mot));
    res.render('index', { mots: motsTries });
});

app.get('/favoris', (req, res) => {
    const userId = getUserId(req);
    const favorisData = getFavorisData();
    const userFavoris = favorisData[userId] || [];
    res.render('favoris', { mots, userFavoris });
});

app.get('/top10', (req, res) => {
    const topFavoris = getTopFavoris();
    const motsFavoris = topFavoris.map(item => {
        const mot = mots.find(m => m.Mot.toLowerCase() === item.mot.toLowerCase());
        return { ...mot, count: item.count };
    }).filter(Boolean);
    res.render('top10', { motsFavoris });
});

// API pour gérer les favoris
app.post('/api/favoris/toggle', (req, res) => {
    const { mot } = req.body;
    const userId = getUserId(req);
    
    if (!mot) {
        return res.status(400).json({ error: 'Mot requis' });
    }
    
    const favorisData = getFavorisData();
    let userFavoris = favorisData[userId] || [];
    
    // Convertir ancien format si nécessaire
    userFavoris = userFavoris.map(favori => {
        if (typeof favori === 'string') {
            return { mot: favori };
        }
        return { mot: favori.mot };
    });
    
    const motLower = mot.toLowerCase();
    const index = userFavoris.findIndex(f => f.mot === motLower);
    
    if (index !== -1) {
        // Retirer des favoris
        userFavoris.splice(index, 1);
    } else {
        // Ajouter aux favoris
        userFavoris.push({
            mot: motLower,
            dateAjout: new Date().toISOString()
        });
    }
    
    favorisData[userId] = userFavoris;
    saveFavorisData(favorisData);
    
    res.json({ 
        success: true, 
        isFavori: index === -1,
        favoris: userFavoris
    });
});

app.get('/api/favoris', (req, res) => {
    const userId = getUserId(req);
    const favorisData = getFavorisData();
    const userFavoris = favorisData[userId] || [];
    res.json(userFavoris);
});

app.get('/mots/:nom', (req, res) => {
    const nom = req.params.nom.toLowerCase();
    const mot = mots.find(m => m.Mot.toLowerCase() === nom);
    if (mot) {
        res.render('mot', { mot });
    } else {
        res.status(404).send('Mot introuvable');
    }
});

app.listen(PORT, () => {
    console.log(`Serveur lancé : http://localhost:${PORT}`);
});
