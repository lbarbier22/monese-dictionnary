const express = require('express');
const path = require('path');
const fs = require('fs');
const mots = require('./ressources/rare_words.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'vues'));
app.use(express.static(path.join(__dirname, 'public')));

const FAVORIS_FILE = path.join(__dirname, 'data', 'favoris.json');

if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

if (!fs.existsSync(FAVORIS_FILE)) {
    fs.writeFileSync(FAVORIS_FILE, JSON.stringify({}));
}

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
    return req.ip || req.connection.remoteAddress || 'anonymous';
}

function getTopFavoris() {
    const favorisData = getFavorisData();
    const motCounts = {};
    
    Object.values(favorisData).forEach(userFavoris => {
        userFavoris.forEach(favori => {
            const mot = favori.mot || favori;
            motCounts[mot] = (motCounts[mot] || 0) + 1;
        });
    });
    
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
    const likesFile = path.join(__dirname, 'likes.json');
    
    let likes = {};
    if (fs.existsSync(likesFile)) {
        try {
            const data = fs.readFileSync(likesFile, 'utf8');
            likes = JSON.parse(data);
        } catch (error) {
            console.error('Erreur lors de la lecture des likes:', error);
        }
    }
    
    const motsAvecLikes = Object.entries(likes)
        .map(([motLower, count]) => {
            const motOriginal = mots.find(m => m.Mot.toLowerCase() === motLower);
            return {
                ...motOriginal,
                count: count
            };
        })
        .filter(item => item && item.Mot)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    
    res.render('top10', { motsFavoris: motsAvecLikes });
});

app.get('/api/likes/:mot', (req, res) => {
    const mot = req.params.mot.toLowerCase();
    const likesFile = path.join(__dirname, 'likes.json');
    
    let likes = {};
    if (fs.existsSync(likesFile)) {
        try {
            const data = fs.readFileSync(likesFile, 'utf8');
            likes = JSON.parse(data);
        } catch (error) {
            console.error('Erreur lors de la lecture des likes:', error);
        }
    }
    
    res.json({ likes: likes[mot] || 0 });
});

app.post('/api/likes/add', (req, res) => {
    const { mot } = req.body;
    if (!mot) {
        return res.status(400).json({ error: 'Mot requis' });
    }
    
    const motLower = mot.toLowerCase();
    const likesFile = path.join(__dirname, 'likes.json');
    
    let likes = {};
    if (fs.existsSync(likesFile)) {
        try {
            const data = fs.readFileSync(likesFile, 'utf8');
            likes = JSON.parse(data);
        } catch (error) {
            console.error('Erreur lors de la lecture des likes:', error);
        }
    }
    
    likes[motLower] = (likes[motLower] || 0) + 1;
    
    try {
        fs.writeFileSync(likesFile, JSON.stringify(likes, null, 2));
        res.json({ success: true, likes: likes[motLower] });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des likes:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/api/likes/remove', (req, res) => {
    const { mot } = req.body;
    if (!mot) {
        return res.status(400).json({ error: 'Mot requis' });
    }
    
    const motLower = mot.toLowerCase();
    const likesFile = path.join(__dirname, 'likes.json');
    
    let likes = {};
    if (fs.existsSync(likesFile)) {
        try {
            const data = fs.readFileSync(likesFile, 'utf8');
            likes = JSON.parse(data);
        } catch (error) {
            console.error('Erreur lors de la lecture des likes:', error);
        }
    }
    
    if (likes[motLower] && likes[motLower] > 0) {
        likes[motLower] = likes[motLower] - 1;
        if (likes[motLower] === 0) {
            delete likes[motLower];
        }
    }
    
    try {
        fs.writeFileSync(likesFile, JSON.stringify(likes, null, 2));
        res.json({ success: true, likes: likes[motLower] || 0 });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des likes:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/api/favoris/toggle', (req, res) => {
    const { mot } = req.body;
    const userId = getUserId(req);
    
    if (!mot) {
        return res.status(400).json({ error: 'Mot requis' });
    }
    
    const favorisData = getFavorisData();
    let userFavoris = favorisData[userId] || [];
    
    userFavoris = userFavoris.map(favori => {
        if (typeof favori === 'string') {
            return { mot: favori };
        }
        return { mot: favori.mot };
    });
    
    const motLower = mot.toLowerCase();
    const index = userFavoris.findIndex(f => f.mot === motLower);
    
    if (index !== -1) {
        userFavoris.splice(index, 1);
    } else {
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
