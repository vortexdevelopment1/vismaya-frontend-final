"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * useAsync hook for executing promises with safe loading, error states,
 * unmounted component protection, and double-submit mutation guards.
 *
 * @param {Function} asyncFunction - The async function to execute
 * @param {Object} options - { immediate: boolean, initialData: any, onSuccess: fn, onError: fn }
 */
export function useAsync(asyncFunction, options = {}) {
  const { immediate = false, initialData = null, onSuccess, onError } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);
  const isExecutingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args) => {
      // Double-submit guard: prevent re-entry if already executing
      if (isExecutingRef.current) {
        return { success: false, error: "Operation already in progress" };
      }

      isExecutingRef.current = true;
      if (isMountedRef.current) {
        setLoading(true);
        setIsSubmitting(true);
        setError(null);
      }

      try {
        const result = await asyncFunction(...args);
        if (isMountedRef.current) {
          setData(result);
          setLoading(false);
          setIsSubmitting(false);
        }
        if (onSuccess) {
          onSuccess(result);
        }
        return { success: true, data: result };
      } catch (err) {
        if (isMountedRef.current) {
          setError(err);
          setLoading(false);
          setIsSubmitting(false);
        }
        if (onError) {
          onError(err);
        }
        return { success: false, error: err };
      } finally {
        isExecutingRef.current = false;
      }
    },
    [asyncFunction, onSuccess, onError]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setIsSubmitting(false);
    setError(null);
    isExecutingRef.current = false;
  }, [initialData]);

  return {
    execute,
    data,
    loading,
    isSubmitting,
    error,
    reset,
    setData,
  };
}

export default useAsync;
