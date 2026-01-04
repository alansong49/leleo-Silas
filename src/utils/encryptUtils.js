/**
 * 简单的加密/解密工具
 * 使用 XOR 加密算法
 */

// 加密密钥（可以自定义）
const ENCRYPT_KEY = 'leleo_encrypt_key_2024';

/**
 * 加密字符串
 * @param {string} text - 要加密的文本
 * @returns {string} - 加密后的字符串（Base64 编码）
 */
export function encrypt(text) {
  if (!text) return '';
  
  let encrypted = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const keyChar = ENCRYPT_KEY.charCodeAt(i % ENCRYPT_KEY.length);
    encrypted += String.fromCharCode(charCode ^ keyChar);
  }
  
  // 转换为 Base64 以便安全存储
  return btoa(encrypted);
}

/**
 * 解密字符串
 * @param {string} encryptedText - 加密的文本（Base64 编码）
 * @returns {string} - 解密后的原始文本
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return '';
  
  try {
    // 从 Base64 解码
    const encrypted = atob(encryptedText);
    
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted.charCodeAt(i);
      const keyChar = ENCRYPT_KEY.charCodeAt(i % ENCRYPT_KEY.length);
      decrypted += String.fromCharCode(charCode ^ keyChar);
    }
    
    return decrypted;
  } catch (error) {
    console.error('解密失败:', error);
    return '';
  }
}

