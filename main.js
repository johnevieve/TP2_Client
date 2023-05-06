import './style.css';
import axios from 'axios';

let token = 'er81NiUqmlTkgnr2euJh3VSJwKmIKNsb';

const instanceAxios = axios.create({
    baseURL: 'http://localhost/battleship-ia/parties',
    params: { 'api_key' : token }
});

/*async function getTrendings() {
    try {
        return await instanceAxios.get('trending', { params: { limit: 10 }});
    } catch (error) {
        // ...
        console.error(error);
    }
}*/

/*async function getGifURL(id) {
    try {
        const response = await instanceAxios.get(id);
        return response?.data?.data?.images?.fixed_height?.url;
    } catch (error) {
        // ...
        console.error(error);
    }
}*/

/*function refreshImage() {
    getTrendings().then(response => {
        let firstId = response?.data?.data[0]?.id;

        if (firstId) {
            getGifURL(firstId).then(response => {
                if (response) {
                    let image = document.createElement('img');
                    image.src = response;
                    document.body.appendChild(image);
                }
            })
        }
    })
}*/

//refreshImage();

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

var idPartie = null;
var nomJoueur = "Joueur 1"
var nomAdversaire = "IA";

var posBateauxJoueur = {}
var posBateauxAdversaire = {};

var missilesJoueur = {}
var missilesAdversaire = {}

var directionPlacement = true;

async function creationPartie() {
    try {
        return await instanceAxios.post(nomAdversaire);
    } catch (error) {
        afficherMessageErreur(error);
    }
}

async function terminerPartie() {
    try {
        return await instanceAxios.delete(idPartie);
    } catch (error) {
        afficherMessageErreur(error);
    }
}

async function recevoirMissile() {
    try {
        const response = await instanceAxios.post(idPartie + '/missiles');
        let coordonnee = response?.data?.data?.coordonnee;
        envoieResultatMissile(coordonnee);
    } catch (error) {
        afficherMessageErreur(error);
    }
}

async function envoieResultatMissile(coordonnee) {
    try {
        let resultat = verifierPositionBateau(coordonnee);
        const response = await instanceAxios.put(idPartie + '/missiles/' + coordonnee, resultat);
    } catch (error) {
        afficherMessageErreur(error);
    }
}

function nouvellePartie() {   
    creationPartie().then(
        response => {
            idPartie = response?.data?.data?.id;
            posBateauxAdversaire = response?.data?.data?.bateaux;

            document.getElementById('id_partie').innerHTML = "Partie ID : " + idPartie;
            document.getElementById('nom_joueur').innerHTML = "Joueur : " + nomJoueur;
            document.getElementById('nom_adversaire').innerHTML = "Adversaire : " + nomAdversaire;

            let bouton = document.getElementById('boutton_partie');

            bouton.innerHTML = "Terminée Partie";
            bouton.onclick(terminerPartie);

            initierTableaux("tableau_joueur");
            initierTableaux("tableau_adversaire");
        }
    );
}

function initierTableaux(divId) {
    let tableau = document.getElementById(divId);
    let element;

    for (let i = 0; i <= 10; i++) {
        element = document.createElement("div");
        element.id = "border";

        if (i != 0) {
            element.innerHTML = i;
        }

        tableau.appendChild(element);
    }

    for (let x = A; x <= J; x++) {
        element = document.createElement("div");
        element.id = "border";
        element.innerHTML = x;
        tableau.appendChild(element);

        for (let y = 1; y <= 10; y++) {
            element = document.createElement("div");
            element.id = x + "-" + y;
            element.addEventListener('mouseover', verifierPlacementBateau);
            tableau.appendChild(element);
        }
    }
}

function verifierPlacementBateau() {
    let indexBateau = 0;

    if (indexBateau > 4) {
        let tableauJoueur = document.getElementById("tableau_joueur").querySelectorAll(!"border");
        let tableauAdversaire = document.getElementById("tableau_adversaire").querySelectorAll(!"border");

        tableauJoueur.forEach((element) => {
            element.removeEventListener('mouseover', verifierPlacementBateau);
        })

        tableauAdversaire.forEach((element) => {
            element.addEventListener('click', verifierPositionBateau);
        })
    }
}

function verifierPositionBateau(coordonnee) {

}

function changerDirectionPlacementBateau() {
    directionPlacement = !directionPlacement;
}

function afficherMessageErreur(error) {
    document.getElementById("error_message").innerHTML = error.message;
    console.error(error);
}