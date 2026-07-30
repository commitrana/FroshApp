import { useSafeAreaInsets } from "react-native-safe-area-context";
import Spacing from "../constants/spacing";

/**
 * Top offset for a screen's own top bar.
 *
 * Every screen renders with `headerShown: false`, so each one must clear the
 * status bar / notch / Dynamic Island itself (Apple HIG: content must not be
 * obscured by the status bar). Returns the live top safe-area inset plus one
 * Spacing token of breathing room, replacing hardcoded Platform guesses.
 *
 * Invariant: exactly ONE element per screen consumes this value. If a screen
 * wraps content in a SafeAreaView, that SafeAreaView must NOT own the top edge
 * (use `edges={['bottom']}`), or the inset is applied twice.
 *
 * @param gap breathing room below the inset. Defaults to Spacing.sm (8).
 */
export function useTopInset(gap: number = Spacing.sm): number {
  const { top } = useSafeAreaInsets();
  return top + gap;
}

export default useTopInset;
