import config from '../config';

// Storage base derived from the API base (…/api/v1/ → …/).
const FILE_BASE = config.BASE_URL.replace(/\/api\/v1\/?$/, '/');

// Build a full URL from a relative storage path (e.g. "listings/x.jpg").
export const fileUrl = (path) => (path ? `${FILE_BASE}storage/${path}` : null);

export default fileUrl;
