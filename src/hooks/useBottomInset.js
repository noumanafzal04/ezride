import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Bottom padding for stack-pushed screens that have no bottom tab bar,
 * so list/scroll content (and footer buttons) clear the device nav bar /
 * home indicator. Tab screens don't need this — the tab bar already pads.
 *
 * Usage: const pb = useBottomInset();  // → insets.bottom + base (default 24)
 */
export const useBottomInset = (base = 24) => {
    const insets = useSafeAreaInsets();
    return insets.bottom + base;
};

export default useBottomInset;
