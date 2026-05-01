import Keycloak from 'keycloak-js';

const initOptions = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'basedb',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'base-frontend',
};

const keycloak = new Keycloak(initOptions);

export const initKeycloak = () => {
  return new Promise((resolve, reject) => {
    keycloak
      .init({ 
        onLoad: 'check-sso', 
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        checkLoginIframe: false 
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
