<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Logo -->
      <div class="login-header">
        <div class="login-logo">⚡ Lumicore</div>
        <div class="login-subtitle">Internal Tracker — Sign in to continue</div>
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

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  background: #1a1740;
  padding: 1.25rem;
}

.login-card {
  background: #fff;
  border-radius: 20px;
  padding: 2.25rem 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 24px 60px rgba(26, 23, 64, 0.35);
}

.login-header {
  text-align: center;
  margin-bottom: 1.75rem;
}

.login-logo {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--p-primary-600, #4f46e5);
  margin-bottom: 0.375rem;
}

.login-subtitle {
  font-size: 0.85rem;
  color: #64748b;
}

/* Mobile: tighter padding */
@media (max-width: 480px) {
  .login-card {
    padding: 1.75rem 1.25rem;
    border-radius: 16px;
  }
}
</style>


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
