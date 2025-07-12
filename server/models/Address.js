// Address.js - Enhanced version with complete validation

class Address {
  constructor(addressData) {
    this.fullName = addressData.fullName;
    this.country = addressData.country;
    this.city = addressData.city;
    this.state = addressData.state;
    this.zip = addressData.zip;
    this.streetAddress = addressData.streetAddress;
  }

  /**
   * Validates the entire address object
   * @returns {boolean} True if all fields are valid
   */
  isValid() {
    return (
      Address.validFullName(this.fullName) &&
      Address.validCountry(this.country) &&
      Address.validCity(this.city) &&
      Address.validState(this.state, this.country) &&
      Address.validZip(this.zip, this.country) &&
      Address.validStreetAddress(this.streetAddress)
    );
  }

  /**
   * Validates full name
   * @param {string} fullName - Person's full name
   * @returns {boolean} True if name is valid
   */
  static validFullName(fullName) {
    if (typeof fullName !== "string") return false;

    // Name should be at least 2 characters
    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) return false;

    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    return /^[A-Za-z\s\-']+$/.test(trimmedName);
  }

  /**
   * Validates country name
   * @param {string} country - Country name
   * @returns {boolean} True if country is valid
   */
  static validCountry(country) {
    if (typeof country !== "string") return false;

    const trimmedCountry = country.trim();
    // Country should be at least 2 characters
    if (trimmedCountry.length < 2) return false;

    // Basic check for valid characters (letters, spaces, hyphens)
    return /^[A-Za-z\s\-]+$/.test(trimmedCountry);
  }

  /**
   * Validates city name
   * @param {string} city - City name
   * @returns {boolean} True if city is valid
   */
  static validCity(city) {
    if (typeof city !== "string") return false;

    const trimmedCity = city.trim();
    // City should be at least 2 characters
    if (trimmedCity.length < 2) return false;

    // Check for valid characters (letters, spaces, hyphens, periods)
    return /^[A-Za-z\s\-\.]+$/.test(trimmedCity);
  }

  /**
   * Validates state/province based on country
   * @param {string} state - State or province name/code
   * @param {string} country - Country name to determine validation rules
   * @returns {boolean} True if state is valid for the country
   */
  static validState(state, country) {
    if (typeof state !== "string") return false;

    const trimmedState = state.trim();
    if (trimmedState.length === 0) return false;

    // For US, validate state code (2 uppercase letters)
    if (country && country.trim().toUpperCase() === "UNITED STATES" ||
      country && country.trim().toUpperCase() === "USA" ||
      country && country.trim().toUpperCase() === "US") {
      return /^[A-Z]{2}$/.test(trimmedState);
    }

    // For Canada, validate province code (2 uppercase letters)
    if (country && country.trim().toUpperCase() === "CANADA" ||
      country && country.trim().toUpperCase() === "CA") {
      return /^[A-Z]{2}$/.test(trimmedState);
    }

    // For other countries, just ensure it's not empty and has valid characters
    return /^[A-Za-z\s\-\.]+$/.test(trimmedState);
  }

  /**
   * Validates ZIP/postal code based on country
   * @param {string} zip - ZIP/postal code
   * @param {string} country - Country name to determine validation rules
   * @returns {boolean} True if ZIP code is valid for the country
   */
  static validZip(zip, country) {
    if (typeof zip !== "string") return false;

    const trimmedZip = zip.trim();

    // For US, validate 5-digit or 5+4 format
    if (country && country.trim().toUpperCase() === "UNITED STATES" ||
      country && country.trim().toUpperCase() === "USA" ||
      country && country.trim().toUpperCase() === "US") {
      return /^\d{5}(-\d{4})?$/.test(trimmedZip);
    }

    // For Canada, validate A1A 1A1 format
    if (country && country.trim().toUpperCase() === "CANADA" ||
      country && country.trim().toUpperCase() === "CA") {
      return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(trimmedZip);
    }

    // For UK, validate standard UK postcode format
    if (country && country.trim().toUpperCase() === "UNITED KINGDOM" ||
      country && country.trim().toUpperCase() === "UK" ||
      country && country.trim().toUpperCase() === "GREAT BRITAIN") {
      return /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/.test(trimmedZip.toUpperCase());
    }

    // For other countries, just ensure it's not empty
    return trimmedZip.length > 0;
  }

  /**
   * Validates street address
   * @param {string} streetAddress - Street address
   * @returns {boolean} True if street address is valid
   */
  static validStreetAddress(streetAddress) {
    if (typeof streetAddress !== "string") return false;

    const trimmedAddress = streetAddress.trim();
    // Street address should be at least 3 characters
    if (trimmedAddress.length < 3) return false;

    // Check for valid characters (alphanumeric, spaces, common punctuation)
    return /^[A-Za-z0-9\s\-\.,#'\/]+$/.test(trimmedAddress);
  }

  /**
   * Formats the address as a multi-line string
   * @returns {string} Formatted address
   */
  formatAddress() {
    let formattedAddress = this.fullName;

    if (this.streetAddress) {
      formattedAddress += `\n${this.streetAddress}`;
    }

    let cityStateZip = "";
    if (this.city) cityStateZip += this.city;
    if (this.state) cityStateZip += cityStateZip ? `, ${this.state}` : this.state;
    if (this.zip) cityStateZip += cityStateZip ? ` ${this.zip}` : this.zip;

    if (cityStateZip) {
      formattedAddress += `\n${cityStateZip}`;
    }

    if (this.country) {
      formattedAddress += `\n${this.country}`;
    }

    return formattedAddress;
  }

  toJson() {
    return { ...this, formattedAddress: this.formatAddress() }
  }
}

export default Address;
