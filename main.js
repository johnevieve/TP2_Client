import './style.css';
import axios from 'axios';

// JS - Axios

let token = 'er81NiUqmlTkgnr2euJh3VSJwKmIKNsb';

const instanceAxios = axios.create({
    baseURL: 'https://api.giphy.com/v1/gifs/',
    params: { 'api_key' : token }
});

const config = {
    params: {
        tag: 'burrito'
    }
};

instanceAxios.get('random', config)
    .then(response => {
        let imageSrc = response?.data?.data?.images?.fixed_height?.url;

        if (imageSrc) {
            let image = document.createElement('img');
            image.src = imageSrc;
            document.body.appendChild(image);
        }
    })
    .catch(error => console.log('error', error));

async function getTrendings() {
    try {
        return await instanceAxios.get('trending', { params: { limit: 10 }});
    } catch (error) {
        // ...
        console.error(error);
    }
}

async function getGifURL(id) {
    try {
        const response = await instanceAxios.get(id);
        return response?.data?.data?.images?.fixed_height?.url;
    } catch (error) {
        // ...
        console.error(error);
    }
}

function refreshImage() {
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
}

refreshImage();

/*instanceAxios.interceptors.request.use(function (config) {
    // Faire quelque chose avant que la requête ne soit envoyée
    return config;
}, error => Promise.reject(error));
    instanceAxios.interceptors.response.use(function (response) {
    // Code 2XX
    // Faire quelque chose avec les données de la réponse
    return response;
}, function (error) {
    // Autre que code 2XX
    // Faire quelque chose avec les données de l’erreur
    return Promise.reject(error);
});*/

async function nouvellePartie() {
    try {
        
    } catch (error) {
        
    }
}

async function terminerPartie() {
    try {
        
    } catch (error) {
        
    }
}

async function lancerMissile() {
    try {
        
    } catch (error) {
        
    }
}

async function recevoirMissile() {
    try {
        
    } catch (error) {
        
    }
}