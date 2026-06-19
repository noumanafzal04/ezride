import api from './api';

const driverService = {
    onboard: (formData) =>
        api.post('/driver/onboard', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
};

export default driverService;
