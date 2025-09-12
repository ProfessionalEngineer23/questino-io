// Form validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

export const validateMinLength = (value, minLength) => {
  return value && value.length >= minLength;
};

export const validateMaxLength = (value, maxLength) => {
  return value && value.length <= maxLength;
};

export const validateSurveyTitle = (title) => {
  const sanitizedTitle = sanitizeInput(title);
  if (!validateRequired(sanitizedTitle)) {
    return "Survey title is required";
  }
  if (!validateMinLength(sanitizedTitle, 3)) {
    return "Survey title must be at least 3 characters";
  }
  if (!validateMaxLength(sanitizedTitle, 100)) {
    return "Survey title must be less than 100 characters";
  }
  return null;
};

export const validateQuestionText = (text) => {
  const sanitizedText = sanitizeInput(text);
  if (!validateRequired(sanitizedText)) {
    return "Question text is required";
  }
  if (!validateMinLength(sanitizedText, 5)) {
    return "Question text must be at least 5 characters";
  }
  if (!validateMaxLength(sanitizedText, 500)) {
    return "Question text must be less than 500 characters";
  }
  return null;
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

export const validateForm = (formData, rules) => {
  const errors = {};
  
  for (const [field, value] of Object.entries(formData)) {
    const fieldRules = rules[field];
    if (fieldRules) {
      for (const rule of fieldRules) {
        const error = rule(value);
        if (error) {
          errors[field] = error;
          break; // Stop at first error for this field
        }
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
