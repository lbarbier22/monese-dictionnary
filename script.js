let mots = [];

function afficherMotAleatoire() {
    let mot = mots[Math.floor(Math.random() * mots.length)];
    document.getElementById('mot').textContent = mot.Mot.charAt(0).toUpperCase() + mot.Mot.slice(1) + ' ' + '*'.repeat(mot.Difficulté);
    document.getElementById('definition').textContent = mot.Définition;
    document.getElementById('exemple').textContent = `"${mot.Exemple}"`;
}

fetch('ressources/rare_words.json')
    .then(response => response.json())
    .then(data => {
        mots = data;
        afficherMotAleatoire();
    })
    .catch(error => {
        console.error("Erreur de chargement :", error);
        document.getElementById('mot').textContent = "Erreur de chargement.";
    });

document.getElementById('btn').addEventListener('click', afficherMotAleatoire);
