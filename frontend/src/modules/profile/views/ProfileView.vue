<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '@/modules/auth/stores/userStore';
import { useToastStore } from '@/shared/stores/toastStore';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const toastStore = useToastStore();
const router = useRouter();

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const isSubmitting = ref(false);

// Validaciones replicadas de RegisterView
const isFirstNameValid = computed(() => {
  const re = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  return firstName.value.length >= 2 && re.test(firstName.value);
});

const isLastNameValid = computed(() => {
  return lastName.value.length >= 2 && lastName.value.length <= 30;
});

const isFormValid = computed(() => {
  return isFirstNameValid.value && isLastNameValid.value;
});

onMounted(async () => {
  if (!userStore.user) {
    await userStore.syncSession();
  }
  
  if (userStore.user) {
    firstName.value = userStore.user.firstName;
    lastName.value = userStore.user.lastName;
    email.value = userStore.user.email;
  }
});

const handleUpdate = async () => {
  if (!isFormValid.value) return;
  
  isSubmitting.value = true;

  const result = await userStore.updateProfile(firstName.value, lastName.value);

  if (result?.success) {
    toastStore.addToast('Perfil actualizado correctamente', 'success');
  } else {
    toastStore.addToast(result?.message || 'Error al actualizar el perfil', 'error');
  }
  
  isSubmitting.value = false;
};

const goBack = () => router.push('/');
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 pt-8 pb-24">
    <div class="max-w-md mx-auto w-full">
      <header class="mb-12 text-center">
        <h1 class="text-3xl font-bold tracking-tighter mb-2">Perfil de Usuario</h1>
        <p class="text-geist-accents-5 text-sm">Gestiona tu información personal básica.</p>
      </header>

      <div v-if="userStore.user" class="space-y-8">
        <form @submit.prevent="handleUpdate" class="space-y-6">
          <div class="space-y-1.5">
            <label for="email" class="text-xs font-medium uppercase tracking-widest text-geist-accents-4">Email (No editable)</label>
            <input 
              id="email"
              v-model="email"
              type="email" 
              readonly
              class="w-full bg-geist-accents-1 border border-geist-border rounded-lg px-4 py-3 text-sm text-geist-accents-4 cursor-not-allowed outline-none"
            />
          </div>

          <div class="grid grid-cols-1 gap-6">
            <div class="space-y-1.5">
              <label for="firstName" class="text-xs font-medium uppercase tracking-widest text-geist-accents-4">Nombre</label>
              <input 
                id="firstName"
                v-model="firstName"
                placeholder="Tu nombre"
                required
                class="w-full bg-geist-bg border border-geist-border rounded-lg px-4 py-3 text-sm focus:border-geist-fg transition-colors outline-none"
                :class="{ 'border-red-500/50': firstName.length > 0 && !isFirstNameValid }"
              />
              <p v-if="firstName.length > 0 && !isFirstNameValid" class="text-[10px] text-red-500 font-medium uppercase tracking-wider animate-in fade-in duration-200">Mínimo 2 letras (solo texto).</p>
            </div>
            <div class="space-y-1.5">
              <label for="lastName" class="text-xs font-medium uppercase tracking-widest text-geist-accents-4">Apellidos</label>
              <input 
                id="lastName"
                v-model="lastName"
                placeholder="Tus apellidos"
                required
                class="w-full bg-geist-bg border border-geist-border rounded-lg px-4 py-3 text-sm focus:border-geist-fg transition-colors outline-none"
                :class="{ 'border-red-500/50': lastName.length > 0 && !isLastNameValid }"
              />
              <p v-if="lastName.length > 0 && !isLastNameValid" class="text-[10px] text-red-500 font-medium uppercase tracking-wider animate-in fade-in duration-200">De 2 a 30 carácteres.</p>
            </div>
          </div>

          <div class="pt-6 flex flex-col gap-4">
            <button 
              type="submit"
              :disabled="isSubmitting || !isFormValid"
              class="w-full bg-geist-fg text-geist-bg font-medium py-3 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              {{ isSubmitting ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
            <button 
              type="button"
              @click="goBack"
              class="w-full px-6 py-3 border border-geist-border rounded-lg text-sm font-medium hover:border-geist-fg transition-colors active:scale-[0.98]"
            >
              Volver
            </button>
          </div>
        </form>
      </div>

      <!-- Cargando State -->
      <div v-else class="flex flex-col items-center justify-center py-24 gap-4 animate-pulse">
        <div class="w-12 h-12 border-2 border-geist-border border-t-geist-fg rounded-full animate-spin"></div>
        <p class="text-sm text-geist-accents-4 font-medium tracking-tight">Cargando perfil...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Geist minimal styles already handles most of this via Tailwind */
</style>
