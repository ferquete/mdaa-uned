import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { initKeycloak } from './plugins/keycloak'

const app = createApp(App)

app.use(createPinia())
app.use(router)

initKeycloak().then(() => {
  app.mount('#app')
});
