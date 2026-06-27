-- WarXOne - Test Data: Quiz Questions
-- Run this to insert sample quiz questions for testing

USE warxone_db;

-- Easy questions (5 questions)
INSERT INTO quiz_questions (id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, category, is_active)
VALUES
  (UUID(), 'Which country has the largest population in the world?', 'India', 'China', 'United States', 'Indonesia', 'B', 'China has the largest population with over 1.4 billion people.', 'easy', 'geography', TRUE),
  (UUID(), 'What is the capital of France?', 'London', 'Berlin', 'Paris', 'Madrid', 'C', 'Paris is the capital and largest city of France.', 'easy', 'geography', TRUE),
  (UUID(), 'Which planet is known as the Red Planet?', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'B', 'Mars is called the Red Planet due to its reddish appearance.', 'easy', 'science', TRUE),
  (UUID(), 'How many continents are there?', '5', '6', '7', '8', 'C', 'There are 7 continents: Asia, Africa, North America, South America, Antarctica, Europe, and Australia.', 'easy', 'geography', TRUE),
  (UUID(), 'What is the largest ocean in the world?', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean', 'D', 'The Pacific Ocean is the largest and deepest ocean on Earth.', 'easy', 'geography', TRUE);

-- Medium questions (5 questions)
INSERT INTO quiz_questions (id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, category, is_active)
VALUES
  (UUID(), 'Which year did World War II end?', '1943', '1944', '1945', '1946', 'C', 'World War II ended in 1945 after the surrender of Germany and Japan.', 'medium', 'history', TRUE),
  (UUID(), 'What is the chemical symbol for gold?', 'Ag', 'Fe', 'Au', 'Cu', 'C', 'Au comes from the Latin word "aurum" meaning gold.', 'medium', 'science', TRUE),
  (UUID(), 'Which is the longest river in the world?', 'Amazon', 'Nile', 'Yangtze', 'Mississippi', 'B', 'The Nile River in Africa is the longest river, stretching about 6,650 km.', 'medium', 'geography', TRUE),
  (UUID(), 'Who painted the Mona Lisa?', 'Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Rembrandt', 'B', 'The Mona Lisa was painted by Leonardo da Vinci in the 16th century.', 'medium', 'art', TRUE),
  (UUID(), 'What is the speed of light?', '300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s', 'A', 'The speed of light in vacuum is approximately 299,792 km/s.', 'medium', 'science', TRUE);

-- Hard questions (3 questions)
INSERT INTO quiz_questions (id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, category, is_active)
VALUES
  (UUID(), 'Which element has the highest melting point?', 'Tungsten', 'Carbon', 'Titanium', 'Osmium', 'A', 'Tungsten has the highest melting point of all metals at 3,422°C.', 'hard', 'science', TRUE),
  (UUID(), 'In which year was the United Nations founded?', '1940', '1945', '1950', '1955', 'B', 'The United Nations was founded in 1945 after World War II.', 'hard', 'history', TRUE),
  (UUID(), 'What is the deepest point in the ocean?', 'Puerto Rico Trench', 'Mariana Trench', 'Java Trench', 'Kermadec Trench', 'B', 'The Mariana Trench in the Pacific Ocean is the deepest point at about 11,034 meters.', 'hard', 'geography', TRUE);

-- Super Hard questions (2 questions)
INSERT INTO quiz_questions (id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, category, is_active)
VALUES
  (UUID(), 'Which country has the most time zones?', 'Russia', 'United States', 'France', 'Australia', 'C', 'France has 12 time zones due to its overseas territories.', 'super_hard', 'geography', TRUE),
  (UUID(), 'What is the half-life of carbon-14?', '5,730 years', '10,000 years', '1,000 years', '20,000 years', 'A', 'Carbon-14 has a half-life of approximately 5,730 years and is used in radiocarbon dating.', 'super_hard', 'science', TRUE);

-- Invincible Hard questions (1 question)
INSERT INTO quiz_questions (id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, category, is_active)
VALUES
  (UUID(), 'Which mathematician first used the symbol π (pi)?', 'Archimedes', 'Euclid', 'William Jones', 'Leonhard Euler', 'C', 'Welsh mathematician William Jones first used π in 1706.', 'invincible_hard', 'mathematics', TRUE);

-- Display inserted questions
SELECT id, LEFT(question, 50) as question_preview, difficulty, category 
FROM quiz_questions 
WHERE is_active = TRUE 
ORDER BY difficulty, created_at DESC;
