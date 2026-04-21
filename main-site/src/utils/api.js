const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4999';

export const getApiUrl = (path) => {
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const cleanApi = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
    return `${cleanApi}${cleanPath}`;
};

export const fetchWithRetry = async (url, options = {}, retries = 5, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);
            
            // If the response is not ok (e.g., 502, 503, 504), it might be Render waking up or a temporary glitch
            if (!res.ok) {
                if (res.status >= 500 && i < retries - 1) {
                    console.warn(`Server error ${res.status}. Retrying (${i + 1}/${retries})...`);
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
                throw new Error(`HTTP ${res.status}`);
            }

            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // If it's not JSON, it might be a redirect or a 404 page being served as HTML
                if (i < retries - 1) {
                    console.warn(`Non-JSON response. Retrying (${i + 1}/${retries})...`);
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
                throw new Error('Invalid response format (Non-JSON)');
            }

            return await res.json();
        } catch (err) {
            console.warn(`Attempt ${i + 1}/${retries} failed for ${url}:`, err.message);
            if (i < retries - 1) {
                await new Promise(r => setTimeout(r, delay));
            } else {
                throw err;
            }
        }
    }
};

export const getImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
        return 'https://placehold.co/1200x800?text=Octoink+Image+Coming+Soon';
    }

    if (imagePath.startsWith('http')) return imagePath;

    if (imagePath.startsWith('/portfolio/') || imagePath.startsWith('/portfolios/') || imagePath.startsWith('/logo')) {
        return imagePath;
    }

    const cleanApi = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
    const cleanImagePath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;

    return `${cleanApi}${cleanImagePath}`;
};

export default API_BASE_URL;
