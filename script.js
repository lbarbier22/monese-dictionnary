let mots = [];

function afficherMot(mot, afficherBouton = true) {
    const contenu = document.getElementById('contenu');
    contenu.innerHTML = `
        <div class="mot">${mot.Mot.charAt(0).toUpperCase() + mot.Mot.slice(1)} ${'★'.repeat(mot.Difficulté)}</div>
        <div class="type">${mot.Type.charAt(0).toUpperCase() + mot.Type.slice(1)}</div>
        <div class="definition">${mot.Définition}</div>
        <div class="exemple">"${mot.Exemple}"</div>
        ${afficherBouton ? '<button id="btn">J’en veux un autre !</button>' : ''}
    `;
    if (afficherBouton) {
        document.getElementById('btn').addEventListener('click', afficherMotAleatoire);
    }
}

function afficherMotAleatoire() {
    const mot = mots[Math.floor(Math.random() * mots.length)];
    afficherMot(mot, true);
}

function afficherListe() {
    const contenu = document.getElementById('contenu');
    const motsTries = [...mots].sort((a, b) => a.Mot.localeCompare(b.Mot));
    contenu.innerHTML = '<div class="liste-mots">' +
        motsTries.map(m => `<a href="#" data-mot="${m.Mot}">${m.Mot.charAt(0).toUpperCase() + m.Mot.slice(1)}</a>`).join('<br>') +
        '</div>';

    document.querySelectorAll('.liste-mots a').forEach(lien => {
        lien.addEventListener('click', (e) => {
            e.preventDefault();
            const mot = mots.find(m => m.Mot === lien.dataset.mot);
            if (mot) afficherMot(mot, false);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    fetch('ressources/rare_words.json')
        .then(response => response.json())
        .then(data => {
            mots = data;
            afficherMotAleatoire();
        })
        .catch(error => {
            console.error("Erreur de chargement :", error);
            document.getElementById('contenu').textContent = "Erreur de chargement.";
        });

    document.getElementById('nav-aleatoire').addEventListener('click', (e) => {
        e.preventDefault();
        afficherMotAleatoire();
    });

    document.getElementById('nav-liste').addEventListener('click', (e) => {
        e.preventDefault();
        afficherListe();
    });
});
