-- Add subject column to flashcards table if it doesn't exist
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS subject TEXT;

-- Add is_public column to questions_pool if needed
ALTER TABLE public.questions_pool ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;