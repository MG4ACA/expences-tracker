import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure Amplify Auth resources
 * Currently configured with Cognito User Pools for email/password authentication
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  multifactorAuthentication: {
    mode: 'optional',
  },
  accountRecovery: 'email_only',
  userAttributes: {
    email: {
      required: true,
      mutable: false,
    },
    name: {
      required: false,
      mutable: true,
    },
    preferred_username: {
      required: false,
      mutable: true,
    },
  },
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialCharacters: false,
  },
});
