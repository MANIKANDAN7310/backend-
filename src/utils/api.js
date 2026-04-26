/**
 * Robust fetch utility with automatic retries for handling backend sleep/cold starts
 * @param {string} url - The API endpoint
 * @param {object} options - Fetch options
 * @param {number} retries - Number of retry attempts (default 5)
 * @param {number} delay - Delay between retries in ms (default 5000)
 */
export const fetchWithRetry = async (url, options = {}, retries = 5, delay = 5000) => {
    let lastError;

    for (let i = 0; i < retries; i++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // Increased to 60s for uploads

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    return await response.json();
                } else {
                    const text = await response.text();
                    console.error("Non-JSON Response:", text.substring(0, 100));
                    throw new Error("Invalid response format: Expected JSON but received HTML/Text.");
                }
            }
            
            // Handle non-ok responses
            let message = `HTTP ${response.status}`;
            try {
                const errData = await response.json();
                message = errData.message || message;
            } catch (e) {}
            
            if (response.status >= 500) {
                throw new Error(message);
            } else {
                // For 4xx, stop retrying
                const error = new Error(message);
                error.noRetry = true;
                throw error;
            }

        } catch (err) {
            clearTimeout(timeoutId);
            lastError = err;
            console.error(`❌ Attempt ${i + 1} for ${url} failed:`, err.name === 'AbortError' ? 'Timeout' : err.message);

            if (i < retries - 1 && !err.noRetry) {
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                break;
            }
        }
    }
    throw lastError;
};

