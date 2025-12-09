<template>
  <div class="et-auth-container">
    <div class="et-auth-card">
      <h1 class="et-auth-title">Sign In</h1>
      <p class="et-auth-subtitle">Access your expense tracker</p>

      <form class="et-auth-form" @submit.prevent="onSignIn">
        <!-- Email Field -->
        <div class="et-form-group">
          <label for="email">Email Address</label>
          <InputText
            id="email"
            v-model="form.email"
            type="email"
            placeholder="you@example.com"
            required
            :disabled="isLoading"
          />
        </div>

        <!-- Password Field -->
        <div class="et-form-group">
          <label for="password">Password</label>
          <Password
            id="password"
            v-model="form.password"
            placeholder="Enter your password"
            :feedback="false"
            required
            :disabled="isLoading"
          />
        </div>

        <!-- Error Message -->
        <Toast />
        <div v-if="authError" class="et-alert et-alert-error">
          <i class="pi pi-exclamation-circle" />
          {{ authError }}
        </div>

        <!-- Submit Button -->
        <Button
          type="submit"
          label="Sign In"
          class="w-full"
          :loading="isLoading"
          :disabled="isLoading"
        />
      </form>

      <!-- Sign Up Link -->
      <p class="et-auth-footer">
        Don't have an account?
        <NuxtLink to="/auth/signup" class="et-link"> Sign Up </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup>
  import { useAuth } from '@/composables/useAuth';
  import Button from 'primevue/button';
  import InputText from 'primevue/inputtext';
  import Password from 'primevue/password';
  import Toast from 'primevue/toast';
  import { useToast } from 'primevue/usetoast';
  import { reactive } from 'vue';
  import { useRouter } from 'vue-router';

  const router = useRouter();
  const toast = useToast();
  const { handleSignIn, isLoading: authLoading, error: authError } = useAuth();

  const form = reactive({
    email: '',
    password: '',
  });

  const isLoading = authLoading;

  const onSignIn = async () => {
    try {
      await handleSignIn(form.email, form.password);
      toast.add({
        severity: 'success',
        summary: 'Signed In',
        detail: 'Welcome back!',
        life: 2000,
      });
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/');
      }, 500);
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: 'Sign In Failed',
        detail: err.message || 'Invalid email or password',
        life: 3000,
      });
    }
  };
</script>

<style scoped>
  .et-auth-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, var(--et-primary-light) 0%, var(--et-secondary-light) 100%);
    padding: var(--et-spacing-md);
  }

  .et-auth-card {
    background: white;
    border-radius: 12px;
    padding: var(--et-spacing-xl);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
  }

  .et-auth-title {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 var(--et-spacing-xs) 0;
    color: var(--et-text);
  }

  .et-auth-subtitle {
    font-size: 14px;
    color: var(--et-text-muted);
    margin: 0 0 var(--et-spacing-lg) 0;
  }

  .et-auth-form {
    display: flex;
    flex-direction: column;
    gap: var(--et-spacing-md);
    margin-bottom: var(--et-spacing-lg);
  }

  .et-form-group {
    display: flex;
    flex-direction: column;
    gap: var(--et-spacing-sm);
  }

  .et-form-group label {
    font-size: 13px;
    font-weight: 600;
    color: var(--et-text);
  }

  .et-form-group :deep(.p-inputtext),
  .et-form-group :deep(.p-password-input) {
    width: 100%;
    padding: var(--et-spacing-sm) var(--et-spacing-md);
    border: 1px solid var(--et-border);
    border-radius: 6px;
    font-size: 14px;
  }

  .et-form-group :deep(.p-inputtext:focus),
  .et-form-group :deep(.p-password-input:focus) {
    border-color: var(--et-primary);
    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
  }

  .et-alert {
    padding: var(--et-spacing-md);
    border-radius: 6px;
    display: flex;
    gap: var(--et-spacing-md);
    align-items: flex-start;
    font-size: 14px;
    margin: var(--et-spacing-md) 0;
  }

  .et-alert-error {
    background-color: #fee;
    color: var(--et-danger);
    border: 1px solid var(--et-danger);
  }

  .et-auth-footer {
    text-align: center;
    font-size: 14px;
    color: var(--et-text-muted);
    margin: 0;
  }

  .et-link {
    color: var(--et-primary);
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s;
  }

  .et-link:hover {
    color: var(--et-primary-dark);
  }

  /* Responsive */
  @media (max-width: 480px) {
    .et-auth-container {
      padding: var(--et-spacing-sm);
    }

    .et-auth-card {
      padding: var(--et-spacing-lg);
    }

    .et-auth-title {
      font-size: 24px;
    }
  }
</style>
