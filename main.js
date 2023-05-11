import './style.css';
import axios from 'axios';

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
let nomJoueur = "Joueur 1"
let nomAdversaire = "IA";

let bateauxJoueur = [];
let bateauxAdversaire = [];

let posBateauxJoueur = []
let posBateauxAdversaire = [];

let missilesJoueur = {};
let missilesAdversaire = {}

let indexBateau = 0;
let directionPlacement = true;
let bateauSelectionner = "";
let cordonneeBateauMouse = [];

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
                posBateauxJoueur[i] = [];

                for (let j = 0; j < 10; j++) {
                    posBateauxAdversaire[i][j] = false;
                    posBateauxJoueur[i][j] = false;
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
            colonne.classList.add("caseNormal");
            colonne.setAttribute("id", `${String.fromCharCode(i + 65)}-${j}`);

            if (divId == "tableau_joueur") {
                colonne.addEventListener("mouseover", () => {
                    if (bateauSelectionner) {
                        placerBateau(`${String.fromCharCode(i + 65)}-${j}`);

                        if (cordonneeBateauMouse.length === bateaux[bateauSelectionner] && verifierBateauEstPlacable()) {
                            colonne.addEventListener("click", () => {
                                cordonneeBateauMouse.forEach(coordonnee => {
                                    bateauxJoueur.push(coordonnee);

                                    const cord = coordonnee.split('-')
                                    const ligne = parseInt(cord[1], 10) - 1;
                                    const colonne = cord[0].charCodeAt(0) - 65;
                                    posBateauxJoueur[colonne][ligne] = true;

                                    const caseElement = document.getElementById(coordonnee);
                                    caseElement.classList.remove('caseNormal');
                                    caseElement.classList.add('caseBateau');

                                    console.log(bateauxJoueur);
                                });
                            });
                        }
                    }
                });

                colonne.addEventListener("mouseout", () => {
                    colonne.removeEventListener("click", placerBateau);
                    cordonneeBateauMouse.forEach(coordonnee => {
                        const caseElement = document.getElementById(coordonnee);
                        caseElement.style.backgroundColor = '';
                    });
                    cordonneeBateauMouse = [];
                });
            }

            ligne.appendChild(colonne);
        }
        table.appendChild(ligne);
    }

    div.appendChild(table);
    document.body.appendChild(table);
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
            bateauSelectionner = nom;
        });

        paletteBateaux.appendChild(bateau);
    }
}

function placerBateaux() {
    const paletteBateaux = document.createElement('div');
    paletteBateaux.setAttribute("id", "paletteBateaux");

    const bouton = document.createElement('button');

    bouton.classList.add('bouton-direction');
    bouton.innerHTML = "&#x21b7;";
    bouton.addEventListener('click', changerDirectionPlacementBateau);

    document.body.appendChild(bouton);
    document.body.appendChild(paletteBateaux);

    placerPaletteBateaux();
}

function placerBateau(coordonnee) {
    const cord = coordonnee.split('-')
    let dansPlateau = true;
    if (directionPlacement) {
        for (let j = 0; j < bateaux[bateauSelectionner]; j++) {
            const x = cord[0];
            const y = parseInt(cord[1], 10) + j;
            if (y > taillePlateau) {
                dansPlateau = false;
                break;
            }

            cordonneeBateauMouse.push(`${x}-${y}`);
        }
    } else {
        for (let i = 0; i < bateaux[bateauSelectionner]; i++) {
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
    const cord = coordonnee.split('-')
    if (posBateauxJoueur[cord[0]][cord[1]]) {
        return false;
    }

    return true;
}

// marche
function verifierBateauEstPlacable() {
    cordonneeBateauMouse.forEach(coordonnee => {
        const cord = coordonnee.split('-')
        const ligne = parseInt(cord[1], 10) - 1;
        const colonne = cord[0].charCodeAt(0) - 65;

        if (posBateauxJoueur[colonne][ligne]) {
            return false;
        }
    });

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
