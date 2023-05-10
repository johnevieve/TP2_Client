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

// tester et corriger
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
            document.body.appendChild(idPartieEl);

            const nomJoueurEl = document.createElement('div');
            nomJoueurEl.innerHTML = "Joueur : " + nomJoueur;
            document.body.appendChild(nomJoueurEl);

            const nomAdversaireEl = document.createElement('div');
            nomAdversaireEl.innerHTML = "Adversaire : " + nomAdversaire;
            document.body.appendChild(nomAdversaireEl);

            const bouton = document.createElement('button');
            bouton.innerHTML = "Terminée Partie";
            bouton.onclick = terminerPartie;
            document.body.appendChild(bouton);

            
        }
    );
}

function initierTableaux(divId) {
    let tableau = document.getElementById(divId);
    let element;

    for (let i = 0; i <= 10; i++) {
        element = document.createElement("div");

        if (i != 0) {
            element.innerHTML = i;
        }

        tableau.appendChild(element);
    }

    for (let x = A; x <= J; x++) {
        element = document.createElement("div");
        element.innerHTML = x;
        tableau.appendChild(element);

        for (let y = 1; y <= 10; y++) {
            element = document.createElement("div");
            element.target = x + "-" + y;
            element.addEventListener("mouseover", verifierPlacementBateau);
            element.addEventListener("click", verifierBateauEstPlacable);
            tableau.appendChild(element);
        }
    }
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
