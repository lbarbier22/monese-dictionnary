const express = require('express');
const path = require('path');
const mots = require('./ressources/rare_words.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'vues'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    const mot = mots[Math.floor(Math.random() * mots.length)];
    res.redirect(`/mots/${encodeURIComponent(mot.Mot)}`);
});

app.get('/liste', (req, res) => {
    const motsTries = [...mots].sort((a, b) => a.Mot.localeCompare(b.Mot));
    res.render('index', { mots: motsTries });
});

app.get('/favoris', (req, res) => {
    res.render('favoris', { mots });
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
