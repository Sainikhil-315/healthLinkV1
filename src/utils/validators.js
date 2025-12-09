import { PATTERNS } from './constants';

export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!PATTERNS.EMAIL.test(email)) return 'Invalid email format';
  return null;
};

export const validatePhone = (phone) => {
  if (!phone) return 'Phone number is required';
  if (!PATTERNS.PHONE.test(phone)) return 'Invalid phone number (10 digits starting with 6-9)';
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!PATTERNS.PASSWORD.test(password)) {
    return 'Password must contain uppercase, lowercase, and number';
  }
  return null;
};

export const validateName = (name) => {
  if (!name) return 'Name is required';
  if (name.length < 2) return 'Name must be at least 2 characters';
  if (name.length > 100) return 'Name is too long';
  return null;
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

export const validateBloodGroup = (bloodGroup) => {
  const validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  if (!bloodGroup) return 'Blood group is required';
  if (!validGroups.includes(bloodGroup)) return 'Invalid blood group';
  return null;
};

export const validateLocation = (location) => {
  if (!location) return 'Location is required';
  if (!location.lat || !location.lng) return 'Invalid location coordinates';
  if (location.lat < -90 || location.lat > 90) return 'Invalid latitude';
  if (location.lng < -180 || location.lng > 180) return 'Invalid longitude';
  return null;
};

export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateForm = (values, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = values[field];
    
    if (rule.required) {
      const error = validateRequired(value, rule.label || field);
      if (error) {
        errors[field] = error;
        return;
      }
    }
    
    if (rule.validator && value) {
      const error = rule.validator(value);
      if (error) {
        errors[field] = error;
      }
    }
  });
  
  return errors;
};

export default {
  validateEmail,
  validatePhone,
  validatePassword,
  validateName,
  validateConfirmPassword,
  validateBloodGroup,
  validateLocation,
  validateRequired,
  validateForm
};