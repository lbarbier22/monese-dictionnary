let mots = [];

function afficherMot(mot, afficherBouton = true) {
    const contenu = document.getElementById('contenu');
    const url = `${location.origin}/mot/${encodeURIComponent(mot.Mot.toLowerCase())}`;

    contenu.innerHTML = `
        <div class="bloc-texte">
        <div class="mot">${mot.Mot.charAt(0).toUpperCase() + mot.Mot.slice(1)} ${'★'.repeat(mot.Difficulté)}</div>
        <div class="type">${mot.Type.charAt(0).toUpperCase() + mot.Type.slice(1)}</div>
        <div class="definition">${mot.Définition}</div>
        <div class="exemple">"${mot.Exemple}"</div>
        </div>
        <button id="copy">🔗 Copier le lien</button>
        ${afficherBouton ? '<button id="btn">J’en veux un autre !</button>' : ''}
    `;

    document.getElementById('copy').addEventListener('click', () => {
        navigator.clipboard.writeText(url)
            .then(() => afficherNotification("🔗 Lien copié !"))
            .catch(() => afficherNotification("❌ Échec de la copie.", true));
    });

    if (afficherBouton) {
        document.getElementById('btn').addEventListener('click', () => {
            afficherMotAleatoire();
            history.pushState({}, '', '/');
        });
    }
}

function afficherMotAleatoire() {
    const mot = mots[Math.floor(Math.random() * mots.length)];
    afficherMot(mot, true);
}

function afficherNotification(message, erreur = false) {
    const notif = document.createElement('div');
    notif.className = `notif ${erreur ? 'erreur' : ''}`;
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.classList.add('visible');
    }, 10); // pour forcer la transition

    setTimeout(() => {
        notif.classList.remove('visible');
        setTimeout(() => notif.remove(), 300);
    }, 2500);
}

function afficherMotDepuisURL() {
    const chemin = location.pathname;
    if (chemin.startsWith('/mot/')) {
        const nomMot = decodeURIComponent(chemin.split('/mot/')[1]).toLowerCase();
        const mot = mots.find(m => m.Mot.toLowerCase() === nomMot);
        if (mot) {
            afficherMot(mot, false);
        } else {
            document.getElementById('contenu').textContent = "Mot introuvable.";
        }
    } else if (chemin === '/liste') {
        afficherListe();
    } else {
        afficherMotAleatoire();
    }
}

function afficherListe() {
    const contenu = document.getElementById('contenu');

    const htmlRecherche = `
        <input type="text" id="recherche" placeholder="🔍 Rechercher un mot..." />
        <div class="liste-mots" id="liste-mots"></div>
    `;

    contenu.innerHTML = htmlRecherche;

    const listeContainer = document.getElementById('liste-mots');

    function afficherLiensMots(motsFiltrés) {
        listeContainer.innerHTML = motsFiltrés
            .map(m => `<a href="/mot/${encodeURIComponent(m.Mot.toLowerCase())}">
                ${m.Mot.charAt(0).toUpperCase() + m.Mot.slice(1)}
            </a>`)
            .join('<br>');

        document.querySelectorAll('.liste-mots a').forEach(lien => {
            lien.addEventListener('click', (e) => {
                e.preventDefault();
                const url = lien.getAttribute('href');
                history.pushState({}, '', url);
                afficherMotDepuisURL();
            });
        });
    }

    const motsTries = [...mots].sort((a, b) => a.Mot.localeCompare(b.Mot));
    afficherLiensMots(motsTries);

    document.getElementById('recherche').addEventListener('input', (e) => {
        const filtre = e.target.value.toLowerCase();
        const filtrés = motsTries.filter(m => m.Mot.toLowerCase().includes(filtre));
        afficherLiensMots(filtrés);
    });
}

window.addEventListener('popstate', afficherMotDepuisURL);

document.addEventListener('DOMContentLoaded', () => {
    fetch('ressources/rare_words.json')
        .then(response => response.json())
        .then(data => {
            mots = data;
            afficherMotDepuisURL();
        })
        .catch(error => {
            console.error("Erreur de chargement :", error);
            document.getElementById('contenu').textContent = "Erreur de chargement.";
        });

    document.getElementById('nav-aleatoire').addEventListener('click', (e) => {
        e.preventDefault();
        history.pushState({}, '', '/');
        afficherMotAleatoire();
    });

    document.getElementById('nav-liste').addEventListener('click', (e) => {
        e.preventDefault();
        history.pushState({}, '', '/liste');
        afficherListe();
    });
});
