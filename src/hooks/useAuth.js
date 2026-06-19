import { useMutation } from '@tanstack/react-query';
import useAuthStore from '../store/authStore';
import useUserStore from '../store/userStore';
import authService from '../services/authService';

const useAuth = () => {
    // Per-field selectors so consumers only re-render when *their* values change
    const token                 = useAuthStore(s => s.token);
    const isFullyAuthenticated  = useAuthStore(s => s.isFullyAuthenticated);
    const setToken              = useAuthStore(s => s.setToken);
    const setFullyAuthenticated = useAuthStore(s => s.setFullyAuthenticated);
    const clearAuth             = useAuthStore(s => s.clearAuth);
    const user                  = useUserStore(s => s.user);
    const setUser               = useUserStore(s => s.setUser);
    const clearUser             = useUserStore(s => s.clearUser);

    // ─── Signup ───────────────────────────────────────────────
    const signupMutation = useMutation({
        mutationFn: (payload) => authService.signup(payload),
    });

    // ─── Verify OTP ───────────────────────────────────────────
    const verifyOtpMutation = useMutation({
        mutationFn: ({ email, otp }) => authService.verifyOtp(email, otp),
    });

    // ─── Resend OTP ───────────────────────────────────────────
    const resendOtpMutation = useMutation({
        mutationFn: (email) => authService.resendOtp(email),
    });

    // ─── Login ────────────────────────────────────────────────
    const loginMutation = useMutation({
        mutationFn: (payload) => authService.login(payload),
        onSuccess: (res) => {
            const data = res.data?.data || {};
            if (data.token) setToken(data.token);
            if (data.user)  setUser(data.user);
            setFullyAuthenticated();
        },
    });

    // ─── Logout ───────────────────────────────────────────────
    const logout = () => {
        // Clear local instantly
        clearAuth();
        clearUser();
        // Fire server logout in background
        authService.logout().catch(() => {});
    };

    return {
        user,
        token,
        isLoggedIn: !!token && isFullyAuthenticated,

        signup:    signupMutation.mutate,
        verifyOtp: verifyOtpMutation.mutate,
        resendOtp: resendOtpMutation.mutate,
        login:     loginMutation.mutate,
        logout,

        signingUp:    signupMutation.isPending,
        verifyingOtp: verifyOtpMutation.isPending,
        resendingOtp: resendOtpMutation.isPending,
        loggingIn:    loginMutation.isPending,

        signupError:    signupMutation.error,
        verifyOtpError: verifyOtpMutation.error,
        resendOtpError: resendOtpMutation.error,
        loginError:     loginMutation.error,

        signupMutation,
        verifyOtpMutation,
        resendOtpMutation,
        loginMutation,
    };
};

export default useAuth;
