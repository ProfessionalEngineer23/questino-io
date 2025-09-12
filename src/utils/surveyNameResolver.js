// Utility to resolve survey name conflicts by adding numbers

/**
 * Resolves survey name conflicts by checking existing surveys and adding numbers
 * @param {string} baseTitle - The original survey title
 * @param {Array} existingSurveys - Array of existing surveys
 * @returns {string} - The resolved title with number suffix if needed
 */
export function resolveSurveyNameConflict(baseTitle, existingSurveys) {
  if (!baseTitle || !existingSurveys || existingSurveys.length === 0) {
    return baseTitle;
  }

  const trimmedTitle = baseTitle.trim();
  if (!trimmedTitle) {
    return baseTitle;
  }

  // Check if the base title already exists (case-insensitive)
  const exactMatch = existingSurveys.find(survey => 
    survey.title && survey.title.trim().toLowerCase() === trimmedTitle.toLowerCase()
  );

  if (!exactMatch) {
    return trimmedTitle;
  }

  // Find all surveys that start with the base title followed by a number
  // Pattern matches: "Title (1)", "Title (2)", etc.
  const titlePattern = new RegExp(`^${escapeRegExp(trimmedTitle)}\\s*\\((\\d+)\\)$`, 'i');
  const numberedSurveys = existingSurveys
    .filter(survey => survey.title && titlePattern.test(survey.title))
    .map(survey => {
      const match = survey.title.match(titlePattern);
      return match ? parseInt(match[1], 10) : 0;
    })
    .sort((a, b) => a - b);

  // Find the next available number
  let nextNumber = 1;
  for (const num of numberedSurveys) {
    if (num === nextNumber) {
      nextNumber++;
    } else {
      break;
    }
  }

  return `${trimmedTitle} (${nextNumber})`;
}

/**
 * Escapes special regex characters in a string
 * @param {string} string - String to escape
 * @returns {string} - Escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks if a survey title already exists
 * @param {string} title - The survey title to check
 * @param {Array} existingSurveys - Array of existing surveys
 * @returns {boolean} - True if title exists, false otherwise
 */
export function surveyTitleExists(title, existingSurveys) {
  if (!title || !existingSurveys || existingSurveys.length === 0) {
    return false;
  }

  return existingSurveys.some(survey => 
    survey.title && survey.title.trim().toLowerCase() === title.trim().toLowerCase()
  );
}

/**
 * Resolves survey name conflicts for copy operations
 * @param {string} originalTitle - The original survey title
 * @param {Array} existingSurveys - Array of existing surveys
 * @returns {string} - The resolved title for the copy
 */
export function resolveCopyNameConflict(originalTitle, existingSurveys) {
  if (!originalTitle || !existingSurveys || existingSurveys.length === 0) {
    return `${originalTitle} (Copy)`;
  }

  const trimmedTitle = originalTitle.trim();
  const copyTitle = `${trimmedTitle} (Copy)`;
  
  // Check if "Title (Copy)" already exists
  const exactCopyMatch = existingSurveys.find(survey => 
    survey.title && survey.title.trim().toLowerCase() === copyTitle.toLowerCase()
  );

  if (!exactCopyMatch) {
    return copyTitle;
  }

  // Find all surveys that start with "Title (Copy" followed by a number
  const copyPattern = new RegExp(`^${escapeRegExp(trimmedTitle)}\\s*\\(Copy\\s*\\((\\d+)\\)\\)$`, 'i');
  const numberedCopies = existingSurveys
    .filter(survey => survey.title && copyPattern.test(survey.title))
    .map(survey => {
      const match = survey.title.match(copyPattern);
      return match ? parseInt(match[1], 10) : 0;
    })
    .sort((a, b) => a - b);

  // Find the next available number for copies
  let nextNumber = 1;
  for (const num of numberedCopies) {
    if (num === nextNumber) {
      nextNumber++;
    } else {
      break;
    }
  }

  return `${trimmedTitle} (Copy (${nextNumber}))`;
}
