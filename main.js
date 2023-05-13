import './style.css';
import axios from 'axios';

const instanceAxios = axios.create();

let token;
let url_api_joueur_ia;

let bateaux = {
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

let idPartie;
let nomJoueur;
let nomAdversaire;
let tourJoueur = null;

let posBateauxJoueur = []
let posBateauxAdversaire = [];

let missilesJoueur = [];
let missilesAdversaire = []

let directionPlacement = true;
let entiterSelectionner = "";
let cordonneeBateauMouse = [];
let partieEnCour = false;

// marche
async function creationPartie(config) {
    try {
        return await instanceAxios.post("/", config);
    } catch (error) {
        afficherMessageErreur(error);
    }
}

async function terminerPartie() {
    try {
        return await instanceAxios.delete("/" + idPartie);
    } catch (error) {
        afficherMessageErreur(error);
    }
}

async function recevoirMissile() {
    try {
        return await instanceAxios.post("/" + idPartie + "/missiles");
    } catch (error) {
        afficherMessageErreur(error);
    }
}

async function envoieResultatMissile(coordonnee) {
    try {
        let resultat = verifierPositionBateau(coordonnee);
        return await instanceAxios.put("/" + idPartie + "/missiles/" + coordonnee, resultat);
    } catch (error) {
        afficherMessageErreur(error);
    }
}

var button = document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    nouvellePartie();
});

// marche
async function nouvellePartie() {

    nomJoueur = document.getElementById('nom_joueur').value;
    nomAdversaire = document.getElementById('nom_adversaire').value;
    url_api_joueur_ia = document.getElementById('url_api_joueur_ia').value;
    token = document.getElementById('jeton_joueur_ia').value;

    instanceAxios.defaults.baseURL = url_api_joueur_ia;
    instanceAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const config = {
        adversaire: nomAdversaire
    };

    creationPartie(config).then(
        response => {
            idPartie = response?.data?.data?.id;

            let bateauxAdversaire = response?.data?.data?.bateaux;

            for (let i = 0; i < taillePlateau; i++) {
                posBateauxAdversaire[i] = [];
                posBateauxJoueur[i] = [];
                missilesJoueur[i] = [];
                missilesAdversaire[i] = [];
                for (let j = 0; j < taillePlateau; j++) {
                    posBateauxAdversaire[i][j] = false;
                    posBateauxJoueur[i][j] = false;
                    missilesJoueur[i][j] = false;
                    missilesAdversaire[i][j] = false;
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
            placerBateaux();

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
    const table = document.createElement("table");
    table.setAttribute("id", divId);
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
            colonne.classList.add("caseNormal");
            colonne.setAttribute("id", `${String.fromCharCode(i + 65)}-${j}`);

            if (divId == "tableau_joueur") {
                colonne.addEventListener("mouseover", () => {
                    if (entiterSelectionner != null) {
                        placerBateau(`${String.fromCharCode(i + 65)}-${j}`);
                    }
                });

                colonne.addEventListener("mouseout", () => {
                    cordonneeBateauMouse.forEach(coordonnee => {
                        const caseElement = document.getElementById(coordonnee);
                        caseElement.style.backgroundColor = '';
                    });
                    cordonneeBateauMouse = [];
                });

                colonne.addEventListener("click", clickCaseJoueur);

            } else {
                colonne.addEventListener("click", () => {
                    clickCaseAdversaire(i, j - 1);
                });

            }

            ligne.appendChild(colonne);
        }
        table.appendChild(ligne);
    }

    div.appendChild(table);
    document.body.appendChild(table);
}

//marche
function clickCaseJoueur() {
    if (cordonneeBateauMouse.length === bateaux[entiterSelectionner] && verifierBateauEstPlacable() && !partieEnCour) {
        cordonneeBateauMouse.forEach(coordonnee => {

            const cord = coordonnee.split('-')
            const ligne = parseInt(cord[1], 10) - 1;
            const colonne = cord[0].charCodeAt(0) - 65;
            posBateauxJoueur[colonne][ligne] = true;

            const caseElement = document.getElementById(coordonnee);
            caseElement.classList.remove('caseNormal');
            caseElement.classList.add('caseBateau');
        });

        delete bateaux[entiterSelectionner];

        if (Object.values(bateaux).some(val => val !== 0)) {
            placerPaletteBateaux();
        } else {
            const pallete = document.getElementById("divPlacerBateaux");

            if (pallete) {
                pallete.remove();
                jouerPartie();
            }
        }
    }
}

function clickCaseAdversaire(x, y) {
    if (partieEnCour && tourJoueur && !missilesJoueur[x][y]) {
        lancerMissile(x, y)
    }
}

// marche
function placerPaletteBateaux() {
    const paletteBateaux = document.getElementById("paletteBateaux");
    paletteBateaux.innerText = "";

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

        bateau.addEventListener('click', () => {
            entiterSelectionner = nom;
        });

        paletteBateaux.appendChild(bateau);
    }
}

//marche
function placerBateaux() {
    const placerBateaux = document.createElement('div');
    placerBateaux.setAttribute("id", "divPlacerBateaux");

    const paletteBateaux = document.createElement('div');
    paletteBateaux.setAttribute("id", "paletteBateaux");

    const bouton = document.createElement('button');

    bouton.classList.add('bouton-direction');
    bouton.innerHTML = "&#x21b7;";
    bouton.addEventListener('click', changerDirectionPlacementBateau);

    placerBateaux.appendChild(bouton);
    placerBateaux.appendChild(paletteBateaux);
    document.body.appendChild(placerBateaux);

    placerPaletteBateaux();
}

//marche
function placerBateau(coordonnee) {
    const cord = coordonnee.split('-')
    let dansPlateau = true;
    if (directionPlacement) {
        for (let j = 0; j < bateaux[entiterSelectionner]; j++) {
            const x = cord[0];
            const y = parseInt(cord[1], 10) + j;
            if (y > taillePlateau) {
                dansPlateau = false;
                break;
            }

            cordonneeBateauMouse.push(`${x}-${y}`);
        }
    } else {
        for (let i = 0; i < bateaux[entiterSelectionner]; i++) {
            const x = String.fromCharCode(cord[0].charCodeAt(0) + i);
            const y = parseInt(cord[1], 10);

            if (x > String.fromCharCode(64 + taillePlateau)) {
                dansPlateau = false;
                break;
            }

            cordonneeBateauMouse.push(`${x}-${y}`);
        }
    }

    if (dansPlateau && verifierBateauEstPlacable()) {
        cordonneeBateauMouse.forEach(coordonnee => {
            const caseElement = document.getElementById(coordonnee);
            caseElement.style.backgroundColor = 'grey';
        });
    } else {
        cordonneeBateauMouse.forEach(coordonnee => {
            const caseElement = document.getElementById(coordonnee);
            caseElement.style.backgroundColor = 'red';
        });
    }

}

function jouerPartie() {
    if (!partieEnCour) {
        tourJoueur = Math.random() < 0.5;
        partieEnCour = true;
        console.log("Advaisaire : ", posBateauxAdversaire);
        console.log("Joueur : ", posBateauxJoueur);
    }

    if (!tourJoueur) {
        recevoirMissile().then(response => {
            console.log("Adversaire : ffiiooouuu", response.data?.data.coordonnee)
            const cord = response.data?.data.coordonnee.split('-');
            const colonne = cord[0].charCodeAt(0) - 65;
            const ligne = parseInt(cord[1]) - 1;
            missilesAdversaire[colonne][ligne] = true;

            const caseJoueur = document.querySelector('#tableau_joueur td#' + String.fromCharCode(colonne + 65) + '-' + (ligne + 1));

            caseJoueur.classList.remove('caseNormal');


            if (posBateauxJoueur[colonne][ligne]) {
                caseJoueur.classList.add('caseToucher');
            } else {
                caseJoueur.classList.add('caseManquer');
            }
        });
        tourJoueur = true;
    }

}

function lancerMissile(colonne, ligne) {
    console.log("Joueur : ffiiooouuu", `${String.fromCharCode(colonne + 65)}-${ligne + 1}`);
    if (tourJoueur) {
        missilesJoueur[colonne][ligne] = true;

        const caseJoueur = document.querySelector('#tableau_adversaire td#' + String.fromCharCode(colonne + 65) + '-' + (ligne + 1));

        caseJoueur.classList.remove('caseNormal');

        if (posBateauxAdversaire[colonne][ligne]) {
            console.log("Joueur : BOOM");
            caseJoueur.classList.add('caseToucher');
        } else {
            caseJoueur.classList.add('caseManquer');
        }

        tourJoueur = false;
        jouerPartie();
    }
}

// marche
function verifierBateauEstPlacable() {
    for (const coordonnee of cordonneeBateauMouse) {
        const cord = coordonnee.split('-');
        const ligne = parseInt(cord[1], 10) - 1;
        const colonne = cord[0].charCodeAt(0) - 65;

        if (posBateauxJoueur[colonne][ligne]) {
            return false;
        }
    }

    return true;
}


// marche 
function changerDirectionPlacementBateau() {
    directionPlacement = !directionPlacement;
    placerPaletteBateaux();
}

// marche 
function afficherMessageErreur(error) {
    document.getElementById("error_message").innerHTML = error.message;
    console.error(error);
}
