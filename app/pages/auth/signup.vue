<template>
  <div class="et-auth-container">
    <div class="et-auth-card">
      <h1 class="et-auth-title">Create Account</h1>
      <p class="et-auth-subtitle">Start tracking your expenses with LKR</p>

      <form class="et-auth-form" @submit.prevent="onSignUp">
        <!-- Name Field -->
        <div class="et-form-group">
          <label for="name">Full Name</label>
          <InputText
            id="name"
            v-model="form.name"
            type="text"
            placeholder="John Doe"
            :disabled="isLoading"
          />
        </div>

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
          <small v-if="errors.email" class="et-error">{{ errors.email }}</small>
        </div>

        <!-- Password Field -->
        <div class="et-form-group">
          <label for="password">Password</label>
          <Password
            id="password"
            v-model="form.password"
            placeholder="At least 8 characters"
            :feedback="false"
            required
            :disabled="isLoading"
          />
          <small class="et-help-text">
            • At least 8 characters<br />
            • 1 uppercase letter<br />
            • 1 lowercase letter<br />
            • 1 number
          </small>
        </div>

        <!-- Confirm Password Field -->
        <div class="et-form-group">
          <label for="confirmPassword">Confirm Password</label>
          <Password
            id="confirmPassword"
            v-model="form.confirmPassword"
            placeholder="Confirm password"
            :feedback="false"
            required
            :disabled="isLoading"
          />
          <small v-if="errors.confirmPassword" class="et-error">
            {{ errors.confirmPassword }}
          </small>
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
          label="Sign Up"
          class="w-full"
          :loading="isLoading"
          :disabled="isLoading"
        />
      </form>

      <!-- Sign In Link -->
      <p class="et-auth-footer">
        Already have an account?
        <NuxtLink to="/auth/signin" class="et-link"> Sign In </NuxtLink>
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
  const { handleSignUp, isLoading: authLoading, error: authError } = useAuth();

  const form = reactive({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const errors = reactive({
    email: '',
    confirmPassword: '',
  });

  const isLoading = authLoading;

  const validateForm = () => {
    errors.email = '';
    errors.confirmPassword = '';

    if (!form.email.includes('@')) {
      errors.email = 'Please enter a valid email';
    }

    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return !errors.email && !errors.confirmPassword;
  };

  const onSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await handleSignUp(form.email, form.password, form.name);
      toast.add({
        severity: 'success',
        summary: 'Account Created',
        detail: 'Please check your email to confirm your account',
        life: 3000,
      });
      // Redirect to sign in after a short delay
      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: 'Sign Up Failed',
        detail: err.message || 'An error occurred during sign up',
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

  .et-help-text {
    font-size: 12px;
    color: var(--et-text-muted);
    line-height: 1.6;
  }

  .et-error {
    font-size: 12px;
    color: var(--et-danger);
    margin-top: var(--et-spacing-xs);
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
