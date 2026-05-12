import Keycloak from 'keycloak-js';

// Usamos variables de entorno estrictas inyectadas por Vite (.env / .env.production)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const initOptions = {
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
};

const keycloak = new Keycloak(initOptions);

export const initKeycloak = () => {
  return new Promise((resolve, reject) => {
    keycloak
      .init({ 
        onLoad: 'check-sso', 
        pkceMethod: 'S256',
        checkLoginIframe: false,
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html'
      })
      .then((authenticated) => {
        resolve(authenticated);
      })
      .catch((error) => {
        console.error('Keycloak initialization failed', error);
        reject(error);
      });
  });
};

export default keycloak;
