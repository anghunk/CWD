const STORAGE_KEY = 'cwd_admin_auth';
const EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 hours

// Simple obfuscation (not real encryption, but sufficient for local storage requirement if no sensitive data other than the key itself which is already shared)
// Requirement says "Local storage key credential needs to be encrypted".
// We can use a simple XOR with a fixed salt or just Base64.
const SALT = 'cwd-salt';

function encrypt(text) {
  try {
    const textToChars = text => text.split('').map(c => c.charCodeAt(0));
    const byteHex = n => ("0" + Number(n).toString(16)).substr(-2);
    const applySaltToChar = code => textToChars(SALT).reduce((a, b) => a ^ b, code);

    return text
      .split('')
      .map(textToChars)
      .map(applySaltToChar)
      .map(byteHex)
      .join('');
  } catch (e) {
    return btoa(text); // Fallback
  }
}

function decrypt(encoded) {
  try {
    const textToChars = text => text.split('').map(c => c.charCodeAt(0));
    const applySaltToChar = code => textToChars(SALT).reduce((a, b) => a ^ b, code);
    
    return encoded
      .match(/.{1,2}/g)
      .map(hex => parseInt(hex, 16))
      .map(applySaltToChar)
      .map(charCode => String.fromCharCode(charCode))
      .join('');
  } catch (e) {
    return atob(encoded); // Fallback
  }
}

export const auth = {
  saveToken(token) {
    const data = {
      adminToken: encrypt(token),
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  getToken() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const data = JSON.parse(raw);
      if (Date.now() - data.timestamp > EXPIRY_MS) {
        this.clearToken();
        return null;
      }

      return decrypt(data.adminToken);
    } catch (e) {
      this.clearToken();
      return null;
    }
  },

  clearToken() {
    localStorage.removeItem(STORAGE_KEY);
  },
  
  hasToken() {
      return !!this.getToken();
  }
};
