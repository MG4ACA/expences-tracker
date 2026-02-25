<template>
  <div class="flex align-items-center justify-content-center min-h-screen bg-gray-900">
    <div class="surface-card p-6 border-round-xl shadow-4" style="width: 380px">
      <div class="text-center mb-5">
        <div class="text-3xl font-bold text-primary mb-1">⚡ Lumicore</div>
        <div class="text-gray-600 text-sm">Internal Tracker — Sign in to continue</div>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="flex flex-column gap-3">
          <div class="flex flex-column gap-1">
            <label class="text-sm font-medium">Email</label>
            <InputText
              v-model="email"
              type="email"
              placeholder="you@lumicorelabs.com"
              :disabled="loading"
              class="w-full"
            />
          </div>
          <div class="flex flex-column gap-1">
            <label class="text-sm font-medium">Password</label>
            <Password
              v-model="password"
              :feedback="false"
              toggleMask
              placeholder="Password"
              :disabled="loading"
              class="w-full"
              inputClass="w-full"
            />
          </div>
          <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
          <Button
            type="submit"
            label="Sign In"
            icon="pi pi-sign-in"
            :loading="loading"
            class="w-full mt-1"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Password from 'primevue/password';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = 'Please enter email and password';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    await auth.login(email.value, password.value);
    router.push('/');
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Login failed. Please try again.';
    loading.value = false;
  }
}
</script>
