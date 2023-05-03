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
    PORTE_AVIONS: 5,
    CUIRASSÉ: 4,
    DESTROYER: 3,
    SOUS_MARIN: 3,
    PATROUILLEUR: 2
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
var nomAdversaire = "IA";

var posBateauxJoueur= {}
var posBateauxIA = {};

var tableauJoueur = {}
var tableauIA = {}

async function creationPartie() {
    try {
        const response = await instanceAxios.post(nomAdversaire);
        idPartie = response?.data?.data?.id;
        posBateauxIA = response?.data?.data?.bateaux;

        document.getElementById('id_partie').innerHTML = "Partie ID : " + idPartie;
        document.getElementById('nom_joueur').innerHTML = "Joueur : " + "Joueur 1";
        document.getElementById('nom_adversaire').innerHTML = "Adversaire : " + nomAdversaire;
    } catch (error) {
        console.error(error);
    }
}

async function terminerPartie() {
    try {
        const response = await instanceAxios.delete(idPartie);
    } catch (error) {
        console.error(error);
    }
}

async function recevoirMissile() {
    try {
        const response = await instanceAxios.post(idPartie + '/missiles');
        let coordonnee = response?.data?.data?.coordonnee;
        resultatMissile(coordonnee);
    } catch (error) {
        console.error(error);
    }
}

async function resultatMissile(coordonnee) {
    try {
        let resultat = verifierPositionBateau(coordonnee);
        const response = await instanceAxios.put(idPartie + '/missiles/' + coordonnee, resultat);
    } catch (error) {
        console.error(error);
    }
}

function nouvellePartie() {    
    let bouton = document.getElementById('boutton_partie');
    //bouton.

    bouton.innerHTML = "Terminée Partie";
    bouton.onclick(terminerPartie());
}

function verifierPlacementPositionBateau() {

}

function verifierPositionBateau(coordonnee) {

}

creationPartie();