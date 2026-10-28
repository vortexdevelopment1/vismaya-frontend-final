"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Custom hook to manage auth loading lifecycle and the 4-second slow timer
 */
export function useAuthSubmitState() {
  const [status, setStatus] = useState("idle"); // "idle" | "submitting" | "slow" | "success"
  const slowTimerRef = useRef(null);

  const startSubmit = useCallback(() => {
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    setStatus("submitting");
    slowTimerRef.current = setTimeout(() => {
      setStatus("slow");
    }, 4000);
  }, []);

  const setSuccess = useCallback(() => {
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    setStatus("success");
  }, []);

  const setError = useCallback(() => {
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    setStatus("idle");
  }, []);

  const reset = useCallback(() => {
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    setStatus("idle");
  }, []);

  useEffect(() => {
    return () => {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
  }, []);

  const isSubmitting = status === "submitting" || status === "slow";
  const isBusy = status !== "idle";

  return {
    status,
    isSubmitting,
    isBusy,
    startSubmit,
    setSuccess,
    setError,
    reset,
  };
}

export default useAuthSubmitState;
