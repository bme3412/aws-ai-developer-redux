const fs = require('fs');
const path = require('path');

// Fisher-Yates shuffle
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const letterIds = ['a', 'b', 'c', 'd'];

function randomizeQuestion(question) {
  const options = question.options;
  const correctIds = question.correctAnswers;

  // Get the correct option objects
  const correctOptions = options.filter(opt => correctIds.includes(opt.id));

  // Shuffle the options
  const shuffledOptions = shuffle(options);

  // Reassign IDs based on new positions
  shuffledOptions.forEach((opt, index) => {
    opt.id = letterIds[index];
  });

  // Find new correct answer IDs
  const newCorrectAnswers = shuffledOptions
    .filter(opt => correctOptions.some(correct => correct.text === opt.text))
    .map(opt => opt.id);

  // Update incorrectExplanations keys if they exist
  if (question.incorrectExplanations) {
    const oldExplanations = question.incorrectExplanations;
    const newExplanations = {};

    // Map old explanations to new positions based on option text
    options.forEach(oldOpt => {
      const explanation = oldExplanations[oldOpt.id];
      if (explanation) {
        const newOpt = shuffledOptions.find(o => o.text === oldOpt.text);
        if (newOpt) {
          newExplanations[newOpt.id] = explanation;
        }
      }
    });

    question.incorrectExplanations = newExplanations;
  }

  question.options = shuffledOptions;
  question.correctAnswers = newCorrectAnswers;

  return question;
}

function processFile(filePath) {
  console.log(`Processing ${filePath}...`);

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  data.questions = data.questions.map(randomizeQuestion);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');

  // Report new distribution
  const distribution = { a: 0, b: 0, c: 0, d: 0 };
  data.questions.forEach(q => {
    q.correctAnswers.forEach(ans => {
      distribution[ans]++;
    });
  });

  console.log(`  New distribution: A=${distribution.a}, B=${distribution.b}, C=${distribution.c}, D=${distribution.d}`);
}

// Process domains 2-5 (domain 1 already has good distribution)
const questionsDir = path.join(__dirname, '..', 'src', 'data', 'questions');

['domain-2.json', 'domain-3.json', 'domain-4.json', 'domain-5.json'].forEach(file => {
  processFile(path.join(questionsDir, file));
});

console.log('\nDone! Answer positions have been randomized.');
