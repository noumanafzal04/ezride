import { useMutation, useQueryClient } from '@tanstack/react-query';
import authService from '../services/authService';
import useUserStore from '../store/userStore';

// Update name + basic profile info. Syncs the user store on success.
export const useUpdateProfile = (options = {}) => {
    const qc = useQueryClient();
    const setUser = useUserStore(s => s.setUser);
    return useMutation({
        mutationFn: (formData) => authService.updateProfile(formData),
        onSuccess: (res, ...rest) => {
            const user = res.data?.data;
            if (user) setUser(user);
            qc.invalidateQueries({ queryKey: ['me'] });
            options.onSuccess?.(res, ...rest);
        },
        onError: options.onError,
    });
};

export default useUpdateProfile;
