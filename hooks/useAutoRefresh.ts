import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";

/**
 * Calls `callback` once immediately, then repeatedly every `intervalMs`,
 * but only while the screen is focused. Polling stops automatically when
 * the user navigates away, and resumes when they come back.
 *
 * Usage:
 *   useAutoRefresh(fetchEvents, 30000); // refresh every 30s while focused
 */
export function useAutoRefresh(
  callback: () => void | Promise<void>,
  intervalMs: number = 30000
) {
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      // Run once as soon as the screen gains focus
      callback();

      const interval = setInterval(() => {
        if (isActive) callback();
      }, intervalMs);

      return () => {
        isActive = false;
        clearInterval(interval);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callback, intervalMs])
  );
}