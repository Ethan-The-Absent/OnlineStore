class CreditCard {
  constructor(creditCardData) {
    this.cardName = creditCardData.cardName;
    this.cardNumber = creditCardData.cardNumber;
    this.cardExp = creditCardData.cardExp;
    this.cardCvv = creditCardData.cardCvv;
    this.cardZip = creditCardData.cardZip;
  }

  /**
   * Validates the entire credit card object
   * @returns {boolean} True if all fields are valid
   */
  isValid() {
    return (
      CreditCard.validName(this.cardName) &&
      CreditCard.validNumber(this.cardNumber) &&
      CreditCard.validExp(this.cardExp) &&
      CreditCard.validCvv(this.cardCvv, this.cardNumber) &&
      CreditCard.validZip(this.cardZip)
    );
  }

  /**
   * Validates cardholder name
   * @param {string} name - Cardholder name
   * @returns {boolean} True if name is valid
   */
  static validName(name) {
    if (typeof name !== "string") return false;
    // Name should be at least 2 characters and contain at least one space (first and last name)
    return name.trim().length >= 2 && name.trim().includes(" ");
  }

  /**
   * Validates credit card number using Luhn algorithm and length check
   * @param {string} cardNum - Credit card number
   * @returns {boolean} True if card number is valid
   */
  static validNumber(cardNum) {
    if (typeof cardNum !== "string") return false;

    // Remove spaces and dashes
    const cleanNum = cardNum.replace(/[\s-]/g, "");

    // Check if it contains only digits
    if (!/^\d+$/.test(cleanNum)) return false;

    // Check length (most cards are 13-19 digits)
    if (cleanNum.length < 13 || cleanNum.length > 19) return false;

    // Luhn algorithm implementation
    let sum = 0;
    let double = false;

    // Start from the right and process each digit
    for (let i = cleanNum.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNum.charAt(i), 10);

      if (double) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      double = !double;
    }

    return sum % 10 === 0;
  }

  /**
   * Determines the card type based on the card number
   * @param {string} cardNum - Credit card number
   * @returns {string|null} Card type or null if unknown
   */
  static getCardType(cardNum) {
    if (typeof cardNum !== "string") return null;

    const cleanNum = cardNum.replace(/[\s-]/g, "");

    // Common card type patterns
    if (/^4/.test(cleanNum)) return "Visa";
    if (/^5[1-5]/.test(cleanNum)) return "Mastercard";
    if (/^3[47]/.test(cleanNum)) return "American Express";
    if (/^6(?:011|5)/.test(cleanNum)) return "Discover";

    return "Unknown";
  }

  /**
   * Validates card expiration date
   * @param {string} cardExp - Expiration date in MM/YY format
   * @returns {boolean} True if expiration date is valid and not expired
   */
  static validExp(cardExp) {
    if (typeof cardExp !== "string") return false;
    if (cardExp.length !== 5) return false;
    if (cardExp[2] !== '/') return false;

    const month = parseInt(cardExp.substring(0, 2), 10);
    const year = parseInt(cardExp.substring(3, 5), 10);

    // Check if month is valid (1-12)
    if (month < 1 || month > 12) return false;

    // Get current date for comparison
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Get last two digits of year
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11

    // Check if card is expired
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return false;
    }

    return true;
  }

  /**
   * Validates CVV code based on card type
   * @param {string} cvv - CVV security code
   * @param {string} cardNumber - Card number to determine card type
   * @returns {boolean} True if CVV is valid for the card type
   */
  static validCvv(cvv, cardNumber) {
    if (typeof cvv !== "string") return false;

    // Remove any spaces
    const cleanCvv = cvv.trim();

    // Check if CVV contains only digits
    if (!/^\d+$/.test(cleanCvv)) return false;

    // American Express requires 4-digit CVV, others use 3-digit
    const cardType = CreditCard.getCardType(cardNumber);
    if (cardType === "American Express") {
      return cleanCvv.length === 4;
    } else {
      return cleanCvv.length === 3;
    }
  }

  /**
   * Validates ZIP/postal code (basic implementation)
   * @param {string} zip - ZIP/postal code
   * @returns {boolean} True if ZIP code format is valid
   */
  static validZip(zip) {
    if (typeof zip !== "string") return false;

    const cleanZip = zip.trim();

    // US ZIP code (5 digits or 5+4)
    if (/^\d{5}(-\d{4})?$/.test(cleanZip)) return true;

    // Canadian postal code (A1A 1A1)
    if (/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(cleanZip)) return true;

    // Basic check for other countries (at least 3 characters)
    return cleanZip.length >= 3;
  }
}

export default CreditCard;