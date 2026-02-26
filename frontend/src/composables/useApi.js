import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';

/**
 * Shared API call wrapper.
 *
 * Usage inside a composable:
 *   const { call, loading, error } = useApi()
 *   await call(() => someApi.list(), { loadingRef: myLoadingRef })
 *
 * Options:
 *   silent      {boolean}  If true, suppress the error toast (caller handles inline display)
 *   loadingRef  {Ref}      External loading ref to toggle (optional)
 */
export function useApi() {
  const toast = useToast();
  const loading = ref(false);
  const error = ref(null);

  async function call(fn, { silent = false, loadingRef = null } = {}) {
    const loadRef = loadingRef ?? loading;
    loadRef.value = true;
    error.value = null;

    try {
      return await fn();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || 'Something went wrong. Please try again.';

      error.value = msg;

      if (!silent) {
        toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
      }

      throw err;
    } finally {
      loadRef.value = false;
    }
  }

  /** Convenience: show a success toast */
  function success(detail, summary = 'Success') {
    toast.add({ severity: 'success', summary, detail, life: 3000 });
  }

  /** Clear the current inline error */
  function clearError() {
    error.value = null;
  }

  return { loading, error, call, success, clearError };
}
