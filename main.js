import './style.css';
import axios from 'axios';

const instanceAxios = axios.create();

let token;
let url_api_joueur_ia;

let bateaux;

const resultat = {
    "à leau": 0,
    "touche": 1,
    "porteAvions": 2,
    "cuirasse": 3,
    "destroyer": 4,
    "sousMarin": 5,
    "patrouilleur": 6
};

const taillePlateau = 10;

let idPartie;
let nomJoueur;
let nomAdversaire;
let tourJoueur = null;

let bateauxAdversaire = {
    porteAvions: [],
    cuirasse: [],
    destroyer: [],
    sousMarin: [],
    patrouilleur: []
}

let bateauxJoueur = {
    porteAvions: [],
    cuirasse: [],
    destroyer: [],
    sousMarin: [],
    patrouilleur: []
}

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

//marche
async function terminerPartie() {
    try {
        return await instanceAxios.delete("/" + idPartie);
    } catch (error) {
        afficherMessageErreur(error);
    }
}

//marche
async function recevoirMissile() {
    try {
        return await instanceAxios.post("/" + idPartie + "/missiles");
    } catch (error) {
        afficherMessageErreur(error);
    }
}

//marche
async function envoieResultatMissile(coordonnee, resultat) {
    try {
        const response = await instanceAxios.put("/" + idPartie + "/missiles/" + coordonnee, resultat);

        return response;
    } catch (error) {
        afficherMessageErreur(error);
    }
}


//marche
var button = document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();

    nomJoueur = document.getElementById('nom_joueur').value;
    nomAdversaire = document.getElementById('nom_adversaire').value;
    url_api_joueur_ia = document.getElementById('url_api_joueur_ia').value;
    token = document.getElementById('jeton_joueur_ia').value;

    instanceAxios.defaults.baseURL = url_api_joueur_ia;
    instanceAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    nouvellePartie();
});

// marche
async function nouvellePartie() {

    const config = {
        adversaire: nomAdversaire
    };

    bateaux = {
        porteAvions: 5,
        cuirasse: 4,
        destroyer: 3,
        sousMarin: 3,
        patrouilleur: 2
    }

    creationPartie(config).then(
        response => {
            idPartie = response?.data?.data?.id;

            let bateauxEnvoyes = response?.data?.data?.bateaux;
            bateauxAdversaire.porteAvions = bateauxEnvoyes['porte-avions'].map(coord => [coord, false]);
            bateauxAdversaire.cuirasse = bateauxEnvoyes['cuirasse'].map(coord => [coord, false]);
            bateauxAdversaire.destroyer = bateauxEnvoyes['destroyer'].map(coord => [coord, false]);
            bateauxAdversaire.sousMarin = bateauxEnvoyes['sous-marin'].map(coord => [coord, false]);
            bateauxAdversaire.patrouilleur = bateauxEnvoyes['patrouilleur'].map(coord => [coord, false]);



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
                for (const [position, bool] of positions) {
                    const [x, y] = position.split('-');
                    posBateauxAdversaire[x.charCodeAt(0) - 'A'.charCodeAt(0)][y - 1] = true;
                }
            }

            if (document.getElementById("formulaire")) {
                document.getElementById("formulaire").remove();
            }
                
            const info = document.createElement('div');
            info.setAttribute("id", 'info');
            document.body.insertBefore(info, document.body.firstChild);

            const idPartieEl = document.createElement('div');
            idPartieEl.setAttribute("id", 'id');
            idPartieEl.innerHTML = "Partie ID : " + idPartie;
            info.appendChild(idPartieEl);

            const nomJoueurEl = document.createElement('div');
            nomJoueurEl.setAttribute("id", 'joueur');
            nomJoueurEl.innerHTML = "Joueur : " + nomJoueur;
            info.appendChild(nomJoueurEl);

            const nomAdversaireEl = document.createElement('div');
            nomAdversaireEl.setAttribute("id", 'adversaire');
            nomAdversaireEl.innerHTML = "Adversaire : " + nomAdversaire;
            info.appendChild(nomAdversaireEl);

            const messageEl = document.createElement('div');
            messageEl.setAttribute("id", 'message');
            messageEl.innerHTML = "";
            info.appendChild(messageEl);

            initierTableaux("tableau_joueur");
            initierTableaux("tableau_adversaire");

            placerBateaux();

            const bouton = document.createElement('button');
            bouton.innerHTML = "Terminée Partie";
            bouton.addEventListener("click", () => {
                finPartie("Abandon");
            });
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
        const cordonneesBateauTuples = cordonneeBateauMouse.map((coord) => [coord, false]);
        bateauxJoueur[entiterSelectionner].push(...cordonneesBateauTuples);

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

                initialiserBateauPresenter('presentationJoueur');
                initialiserBateauPresenter('pesentationAdversaire');

                tourJoueur = Math.random() < 0.5;
                partieEnCour = true;
                if (!tourJoueur) {
                    tourAdversaire();
                }
            }
        }
    }
}

//marche
function initialiserBateauPresenter(divId) {
    const listebateau = document.createElement("div");
    listebateau.setAttribute("id", divId);
    listebateau.classList.add("afficherBateaux");

    let bateauxTaille = {
        porteAvions: 5,
        cuirasse: 4,
        destroyer: 3,
        sousMarin: 3,
        patrouilleur: 2
    };

    for (const [nom, taille] of Object.entries(bateauxTaille)) {
        const bateau = document.createElement("div");
        bateau.setAttribute("id", nom);
        bateau.classList.add("listeBateau");

        bateau.style.display = "inline-grid";
        bateau.style.gridTemplateRows = `repeat(${taille}, 1fr)`;
        bateau.style.width = `30px`;
        bateau.style.height = `${taille * 30}px`;

        for (let i = 1; i <= taille; i++) {
            const carre = document.createElement("div");
            carre.classList.add(`carre`);
            bateau.appendChild(carre);
        }

        listebateau.appendChild(bateau);
    }

    document.body.appendChild(listebateau);
}

//marche
function clickCaseAdversaire(colonne, ligne) {
    if (partieEnCour && tourJoueur && !missilesJoueur[colonne][ligne]) {
        document.getElementById('message').innerHTML = "";
        missilesJoueur[colonne][ligne] = true;
        const caseJoueur = document.querySelector('#tableau_adversaire td#' + String.fromCharCode(colonne + 65) + '-' + (ligne + 1));

        caseJoueur.classList.remove('caseNormal');

        if (posBateauxAdversaire[colonne][ligne]) {
            for (const [nomBateau, positions] of Object.entries(bateauxAdversaire)) {
                for (const [index, [position, bool]] of positions.entries()) {
                    if (position === String.fromCharCode(colonne + 65) + '-' + (ligne + 1)) {
                        bateauxAdversaire[nomBateau][index][1] = true;
                    }
                }
            }
            caseJoueur.classList.add('caseToucher');
            verifierEtatAdversaire(colonne, ligne);
        } else {
            caseJoueur.classList.add('caseManquer');
        }

        tourJoueur = false;
        tourAdversaire();

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

//marche
function tourAdversaire() {
    if (!tourJoueur) {
        document.getElementById('message').innerHTML = "";
        recevoirMissile().then(response => {
            const coordonnee = response.data?.data.coordonnee;
            const cord = coordonnee.split('-');
            const colonne = cord[0].charCodeAt(0) - 65;
            const ligne = parseInt(cord[1]) - 1;

            missilesAdversaire[colonne][ligne] = true;

            const caseJoueur = document.querySelector('#tableau_joueur td#' +
                String.fromCharCode(colonne + 65) + '-' + (ligne + 1));

            caseJoueur.classList.remove('caseNormal');


            if (posBateauxJoueur[colonne][ligne]) {
                for (const [nomBateau, positions] of Object.entries(bateauxJoueur)) {
                    for (const [index, [position, bool]] of positions.entries()) {
                        if (position === String.fromCharCode(colonne + 65) + '-' + (ligne + 1)) {
                            bateauxJoueur[nomBateau][index][1] = true;
                        }
                    }
                }
                caseJoueur.classList.add('caseToucher');

                let retour = verifierEtatJoueur(colonne, ligne);
                envoieResultatMissile(coordonnee, { 'resultat': retour }).then();
            } else {
                caseJoueur.classList.add('caseManquer');
                envoieResultatMissile(coordonnee, { 'resultat': resultat['à leau'] }).then();
            }
        });
        tourJoueur = true;
    }
}

//marche
function verifierEtatJoueur(colonne, ligne) {
    let estFinPartie = true;
    let bateauSelectionne;

    for (const nomBateau in bateauxJoueur) {
        const positions = bateauxJoueur[nomBateau];

        if (positions.some(([position, bool]) => position === String.fromCharCode(colonne + 65) + '-' + (ligne + 1))) {
            bateauSelectionne = nomBateau;

            if (positions.every(([position, touche]) => touche)) {
                const divJoueur = document.getElementById("presentationJoueur");
                const divBateau = divJoueur.querySelector(`#${nomBateau}`);

                if (divBateau) {
                    const carres = divBateau.querySelectorAll(".carre");
                    for (const carre of carres) {
                        carre.style.backgroundColor = "red";
                    }
                }

                document.getElementById('message').innerHTML = `${nomJoueur} a perdu le bateau ${nomBateau}!`;
            }

            for (const [position, bool] of positions) {
                if (!bool) {
                    return resultat['touche'];
                }
            }
        }

        estFinPartie = estFinPartie && positions.every(([position, touche]) => touche);
    }

    if (estFinPartie) {
        finPartie(nomAdversaire);
    }

    console.log(bateauSelectionne);

    return resultat[bateauSelectionne];
}


//marche
function verifierEtatAdversaire(colonne, ligne) {
    let estFinPartie = true;
    let bateauSelectionne;

    for (const nomBateau in bateauxAdversaire) {
        const positions = bateauxAdversaire[nomBateau];

        if (positions.some(([position, bool]) => position === String.fromCharCode(colonne + 65) + '-' + (ligne + 1))) {
            bateauSelectionne = nomBateau;

            if (positions.every(([position, touche]) => touche)) {
                const divJoueur = document.getElementById("pesentationAdversaire");
                const divBateau = divJoueur.querySelector(`#${nomBateau}`);

                if (divBateau) {
                    const carres = divBateau.querySelectorAll(".carre");
                    for (const carre of carres) {
                        carre.style.backgroundColor = "red";
                    }
                }

                document.getElementById('message').innerHTML = `${nomAdversaire} a perdu le bateau ${nomBateau}!`;
            }

            for (const [position, bool] of positions) {
                estFinPartie = estFinPartie && bool;
            }
        }

        estFinPartie = estFinPartie && positions.every(([position, touche]) => touche);
    }

    if (estFinPartie) {
        finPartie(nomJoueur);
    }

}

// marche
function verifierBateauEstPlacable() {
    for (const coordonnee of cordonneeBateauMouse) {
        const coord = coordonnee.split('-');
        const ligne = parseInt(coord[1], 10) - 1;
        const colonne = coord[0].charCodeAt(0) - 65;

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

function finPartie() {
    terminerPartie().then(resultat => {
        const body = document.querySelector('body');
        if (body) {
            body.innerHTML = '';

            const p = document.createElement('p');
            p.textContent = 'La partie est terminée !';

            const btnAccueil = document.createElement('button');
            btnAccueil.textContent = 'Accueil';
            btnAccueil.addEventListener('click', () => {
                window.location.reload();
            });

            const rejouerBtn = document.createElement("button");
            rejouerBtn.textContent = "Rejouer";
            rejouerBtn.addEventListener("click", () => {
                body.innerHTML = '';
                nouvellePartie();
            });

            body.appendChild(p);
            body.appendChild(rejouerBtn);
            body.appendChild(btnAccueil);

        }
    });


}