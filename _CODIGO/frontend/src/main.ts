import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './app/App.vue'
import router from './app/router'
import { initKeycloak } from './app/plugins/keycloak'

const app = createApp(App)

app.use(createPinia())
app.use(router)

initKeycloak().then(() => {
  app.mount('#app')
});
