import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

// Navigate from outside React (e.g. notification taps).
export const navigate = (name, params) => {
    if (navigationRef.isReady()) navigationRef.navigate(name, params);
};

// Hard reset the stack to Login (used by the 401 interceptor)
export const resetToLogin = () => {
    if (navigationRef.isReady()) {
        navigationRef.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] })
        );
    }
};
