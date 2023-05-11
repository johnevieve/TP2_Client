import './style.css';
import axios from 'axios';

let token;
let url_api_joueur_ia;

const bateaux = {
    porteAvions: 5,
    cuirasse: 4,
    destroyer: 3,
    sousMarin: 3,
    patrouilleur: 2
}

const resultat = {
    0: "à l'eau",
    1: "touché",
    2: "porte-avions coulé",
    3: "cuirasse coulée",
    4: "destroyer coulé",
    5: "sous-marin coulé",
    6: "patrouilleur coulé"
}

const taillePlateau = 10;
var idPartie;
var nomJoueur = "Joueur 1"
var nomAdversaire = "IA";

var bateauxJoueur = {}
var bateauxAdversaire = {};

var posBateauxJoueur = []
var posBateauxAdversaire = [];

var missilesJoueur = {}
var missilesAdversaire = {}

var indexBateau = 0;
var directionPlacement = true;
var estPlacable = false;

// marche
async function creationPartie() {
    try {
        return await axios.post(url_api_joueur_ia, { adversaire: nomAdversaire }, { headers: { "Authorization": `Bearer ${token}` } });
    } catch (error) {
        afficherMessageErreur(error);
    }
}

async function terminerPartie() {
    try {
        return await axios.delete(url_api_joueur_ia + "/" + idPartie, { headers: { "Authorization": `Bearer ${token}` } });
    } catch (error) {
        afficherMessageErreur(error);
    }
}

async function recevoirMissile() {
    try {
        const response = await axios.post(url_api_joueur_ia + "/" + idPartie + "/missiles", { headers: { "Authorization": `Bearer ${token}` } });
        let coordonnee = response?.data?.data?.coordonnee;
        envoieResultatMissile(coordonnee);
    } catch (error) {
        afficherMessageErreur(error);
    }
}

async function envoieResultatMissile(coordonnee) {
    try {
        let resultat = verifierPositionBateau(coordonnee);
        const response = await axios.put(
            url_api_joueur_ia + "/" + idPartie + "/missiles/" + coordonnee,
            resultat,
            { headers: { "Authorization": `Bearer ${token}` } });
    } catch (error) {
        afficherMessageErreur(error);
    }
}

var button = document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();

    nomJoueur = document.getElementById('nom_joueur').value;
    nomAdversaire = document.getElementById('nom_adversaire').value;
    url_api_joueur_ia = document.getElementById('url_api_joueur_ia').value;
    token = document.getElementById('jeton_joueur_ia').value;
    nouvellePartie();
});

// marche
async function nouvellePartie() {
    creationPartie().then(
        response => {
            idPartie = response?.data?.data?.id;

            bateauxAdversaire = response?.data?.data?.bateaux;

            for (let i = 0; i < 10; i++) {
                posBateauxAdversaire[i] = [];
                for (let j = 0; j < 10; j++) {
                    posBateauxAdversaire[i][j] = false;
                }
            }


            for (const [bateau, positions] of Object.entries(bateauxAdversaire)) {
                for (const position of positions) {
                    const [x, y] = position.split('-');
                    posBateauxAdversaire[x.charCodeAt(0) - 'A'.charCodeAt(0)][y - 1] = true;
                }
            }

            document.getElementById("formulaire").remove();

            const idPartieEl = document.createElement('div');
            idPartieEl.innerHTML = "Partie ID : " + idPartie;
            document.body.insertBefore(idPartieEl, document.body.firstChild);

            const nomJoueurEl = document.createElement('div');
            nomJoueurEl.innerHTML = "Joueur : " + nomJoueur;
            idPartieEl.insertAdjacentElement('afterend', nomJoueurEl);

            const nomAdversaireEl = document.createElement('div');
            nomAdversaireEl.innerHTML = "Adversaire : " + nomAdversaire;
            nomJoueurEl.insertAdjacentElement('afterend', nomAdversaireEl);

            initierTableaux("tableau_joueur");
            initierTableaux("tableau_adversaire");
            placerBateau();
            
            const bouton = document.createElement('button');
            bouton.innerHTML = "Terminée Partie";
            bouton.onclick = terminerPartie;
            document.body.appendChild(bouton);
        }
    );
}

// marche
function initierTableaux(divId) {
    let div = document.createElement('div');
    div.id = divId;
    const table = document.createElement("table");

    const ligneLettre = document.createElement("tr");
    ligneLettre.appendChild(document.createElement("th"));

    for (let i = 1; i <= taillePlateau; i++) {
        const th = document.createElement("th");
        th.innerText = i;
        ligneLettre.appendChild(th);
    }

    table.appendChild(ligneLettre);

    for (let i = 0; i < taillePlateau; i++) {
        const ligne = document.createElement("tr");
        const th = document.createElement("th");
        th.innerText = String.fromCharCode(i + 65);
        ligne.appendChild(th);

        for (let j = 1; j <= taillePlateau; j++) {
            const colonne = document.createElement("td");
            colonne.classList.add("casePlateau");
            colonne.setAttribute("id", `${String.fromCharCode(i + 65)}-${j}`);
            ligne.appendChild(colonne);
        }
        table.appendChild(ligne);
    }

    div.appendChild(table);
    document.body.appendChild(table);
}

function placerBateau() {
    const paletteBateaux = document.createElement('div');
    paletteBateaux.setAttribute("id", "paletteBateaux");

    for (const [nom, taille] of Object.entries(bateaux)) {
        const bateau = document.createElement('div');
        bateau.setAttribute("id", nom);
        bateau.classList.add("choixBateau");
        for (let i = 1; i <= taille; i++) {
            const carre = document.createElement('div');
            carre.classList.add("carre");
            bateau.appendChild(carre)
        }
        if (directionPlacement) {
            bateau.style.display = "grid";
            bateau.style.gridTemplateColumns = `repeat(${taille}, 1fr)`;
            bateau.style.width = `${taille * 30}px`;
            bateau.style.height = `30px`;
        } else {
            bateau.style.display = "inline-grid";
            bateau.style.gridTemplateRows = `repeat(${taille}, 1fr)`;
            bateau.style.width = `30px`;
            bateau.style.height = `${taille * 30}px`;
        }
        paletteBateaux.appendChild(bateau);
    }
    document.body.appendChild(paletteBateaux);
}

function verifierPlacementBateau() {
    if (indexBateau > 4) {
        let tableauJoueur = document.getElementById("tableau_joueur").querySelectorAll("[target]");
        let tableauAdversaire = document.getElementById("tableau_adversaire").querySelectorAll("[target]");

        tableauJoueur.forEach((element) => {
            element.removeEventListener("mouseover", verifierPlacementBateau);
            element.removeEventListener("click", verifierBateauEstPlacable);
        })

        tableauAdversaire.forEach((element) => {
            element.addEventListener("click", lancerMissile(element.id));
        })
    }
}

function lancerMissile(coordonnee) {

}

function verifierPositionBateau(coordonnee) {
    cord = coordonnee.split('-')
    if (isset(posBateauxJoueur[cord[0]][cord[1]])) {
        return true;
    }

    return false
}

function verifierBateauEstPlacable(coordonneesBateau) {
    coordonneesBateau.forEach(coordonnee => {
        cord = coordonnee.split('-')
        if (isset(posBateauxJoueur[cord[0]][cord[1]])) {
            return false;
        }
    });

    return true;
}

function changerDirectionPlacementBateau() {
    directionPlacement = !directionPlacement;
}

function afficherMessageErreur(error) {
    document.getElementById("error_message").innerHTML = error.message;
    console.error(error);
}
