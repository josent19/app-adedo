const LETTERS_RE = /^[A-Za-zÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÑáéíóúàèìòùäëïöüñ\s'-]*$/
const DIGITS_RE = /^[0-9]*$/
const ALPHANUM_RE = /^[A-Za-z0-9]*$/
const PHONE_RE = /^[0-9+\-\s()]*$/

export function onlyLetters(value) {
  return LETTERS_RE.test(value) ? value : value.replace(/[^A-Za-zÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÑáéíóúàèìòùäëïöüñ\s'-]/g, '')
}

export function onlyDigits(value) {
  return DIGITS_RE.test(value) ? value : value.replace(/[^0-9]/g, '')
}

export function onlyAlphanumeric(value) {
  return ALPHANUM_RE.test(value) ? value : value.replace(/[^A-Za-z0-9]/g, '')
}

export function onlyPhoneChars(value) {
  return PHONE_RE.test(value) ? value : value.replace(/[^0-9+\-\s()]/g, '')
}

export const isLettersOnly = (value) => LETTERS_RE.test(value)
export const isDigitsOnly = (value) => DIGITS_RE.test(value)
export const isAlphanumeric = (value) => ALPHANUM_RE.test(value)
export const isPhoneFormat = (value) => PHONE_RE.test(value)
