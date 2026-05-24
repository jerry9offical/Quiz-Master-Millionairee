-- Add new FIFA Agent Exam question categories to the enum
ALTER TYPE question_category ADD VALUE IF NOT EXISTS 'fifa_regulations';
ALTER TYPE question_category ADD VALUE IF NOT EXISTS 'player_transfers';
ALTER TYPE question_category ADD VALUE IF NOT EXISTS 'agent_ethics';
ALTER TYPE question_category ADD VALUE IF NOT EXISTS 'representation_conflicts';

-- Add a new quiz mode for FIFA exam
ALTER TYPE quiz_mode ADD VALUE IF NOT EXISTS 'fifa_exam';