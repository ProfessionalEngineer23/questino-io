// src/utils/computeStats.ts
export function computeStats(questions, responses) {
  if (!questions || !responses || responses.length === 0) {
    return {};
  }

  const stats = {};

  questions.forEach(question => {
    const questionId = question.$id;
    const questionResponses = responses
      .map(response => response.answers?.[questionId])
      .filter(answer => answer !== undefined && answer !== null);

    if (questionResponses.length === 0) {
      stats[questionId] = { type: question.type, count: 0 };
      return;
    }

    switch (question.type) {
      case 'multiple_choice':
        // Count occurrences of each option
        const optionCounts = {};
        questionResponses.forEach(answer => {
          if (Array.isArray(answer)) {
            // Handle multiple selections
            answer.forEach(option => {
              optionCounts[option] = (optionCounts[option] || 0) + 1;
            });
          } else {
            // Handle single selection
            optionCounts[answer] = (optionCounts[answer] || 0) + 1;
          }
        });

        stats[questionId] = {
          type: 'multiple_choice',
          count: questionResponses.length,
          options: question.options || [],
          counts: optionCounts,
          percentages: {}
        };

        // Calculate percentages
        Object.keys(optionCounts).forEach(option => {
          stats[questionId].percentages[option] = 
            Math.round((optionCounts[option] / questionResponses.length) * 100);
        });
        break;

      case 'scale':
        // Calculate average for scale questions
        const numericValues = questionResponses
          .map(answer => Number(answer))
          .filter(value => !isNaN(value));

        if (numericValues.length > 0) {
          const sum = numericValues.reduce((acc, val) => acc + val, 0);
          const average = sum / numericValues.length;
          
          stats[questionId] = {
            type: 'scale',
            count: numericValues.length,
            average: Math.round(average * 100) / 100, // Round to 2 decimal places
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
            scaleMin: question.scaleMin || 1,
            scaleMax: question.scaleMax || 10
          };
        } else {
          stats[questionId] = {
            type: 'scale',
            count: 0,
            average: 0
          };
        }
        break;

      case 'text':
        // For text questions, just count responses
        const textResponses = questionResponses.filter(answer => 
          typeof answer === 'string' && answer.trim().length > 0
        );

        stats[questionId] = {
          type: 'text',
          count: textResponses.length,
          responses: textResponses
        };
        break;

      case 'yes_no':
        // Count yes/no responses
        const yesCount = questionResponses.filter(answer => 
          answer === 'yes' || answer === true || answer === 'Yes'
        ).length;
        const noCount = questionResponses.length - yesCount;

        stats[questionId] = {
          type: 'yes_no',
          count: questionResponses.length,
          yes: yesCount,
          no: noCount,
          yesPercentage: Math.round((yesCount / questionResponses.length) * 100),
          noPercentage: Math.round((noCount / questionResponses.length) * 100)
        };
        break;

      default:
        stats[questionId] = {
          type: question.type,
          count: questionResponses.length
        };
    }
  });

  return stats;
}

// Transform stats into AI-friendly question summaries
export function computeQuestionSummaries(questions, responses, stats) {
  if (!questions || !responses || !stats) {
    return [];
  }

  return questions.map(question => {
    const questionId = question.$id;
    const questionStats = stats[questionId];
    
    if (!questionStats || questionStats.count === 0) {
      return {
        id: questionId,
        title: question.text || 'Untitled Question',
        type: question.type,
        responses: 0
      };
    }

    const base = {
      id: questionId,
      title: question.text || 'Untitled Question',
      type: question.type,
      responses: questionStats.count
    };

    switch (question.type) {
      case 'scale':
        return {
          ...base,
          average: questionStats.average,
          min: questionStats.min,
          max: questionStats.max,
          scaleMin: questionStats.scaleMin,
          scaleMax: questionStats.scaleMax
        };

      case 'multiple_choice':
        return {
          ...base,
          counts: questionStats.counts,
          percentages: questionStats.percentages
        };

      case 'yes_no':
        return {
          ...base,
          yes: questionStats.yes,
          no: questionStats.no,
          yesPercentage: questionStats.yesPercentage,
          noPercentage: questionStats.noPercentage
        };

      case 'text':
        // Include first 3 sample responses for context
        const sampleText = questionStats.responses
          ?.slice(0, 3)
          ?.map(text => text.length > 100 ? text.substring(0, 100) + '...' : text) || [];
        
        return {
          ...base,
          sampleText
        };

      default:
        return base;
    }
  });
}
