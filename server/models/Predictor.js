class Predictor {
    constructor() {
        this.baseUrl = process.env.PREDICTOR_URL;
        this.headers = {
            'Content-Type': 'application/json'
        };
    }

   /**
   * Generic method for making GET requests.
   * @param {string} endpoint - The API endpoint (e.g., '/users').
   * @param {Object} [params={}] - Query parameters. Values can be a string or an array of strings.
   * Example: { category: ['electronics', 'books'], price_gt: 100 }
   * @returns {Promise<Object>} - The JSON response from the API.
   * @throws {Error} If the API call fails or returns an error status.
   */
  async get(endpoint, params = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    const searchParams = url.searchParams;

    // Iterate over the provided params object
    for (const key in params) {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        const value = params[key];

        // If the value is an array, append each item in the array with the same key
        if (Array.isArray(value)) {
          value.forEach(item => {
            searchParams.append(key, item);
          });
        } else {
          // Otherwise, append the single value
          searchParams.append(key, value);
        }
      }
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => response.text());
        throw new Error(`API call failed with status ${response.status}: ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching from ${url}:`, error.message);
      throw new Error(`Failed to fetch data from external API: ${error.message}`);
    }
  }

}

export default new Predictor();