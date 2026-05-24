import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAudio } from '@/contexts/AudioContext';
import { audioManager } from '@/lib/audio/AudioManager';
import { voiceReader } from '@/lib/audio/VoiceReader';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { MoneyLadder } from '@/components/MoneyLadder';
import { AudioControls } from '@/components/AudioControls';
import { SoftLoginWall } from '@/components/SoftLoginWall';
import { CTAButton } from '@/components/CTAButton';
import { FreeTrialUpgradeModal } from '@/components/FreeTrialUpgradeModal';
import { FreePlaysExhaustedModal } from '@/components/FreePlaysExhaustedModal';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Crown, Zap, Brain, SkipForward, ArrowLeft, Loader2, Lightbulb, Trophy, AlertTriangle, Users } from 'lucide-react';
import { useOptionShuffle } from '@/hooks/useOptionShuffle';

const MONEY_LADDER = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000];
// Free users hit a soft wall after Q3; show upgrade modal (index = 3 means they just finished Q3)
const FREE_WALL_AFTER_QUESTION = 3;
const LOGIN_WALL_AFTER_QUESTION = 5; // Soft login prompt after Q5 for logged-in-but-free users

const CATEGORY_LABELS: Record<string, string> = {
  biology: 'Biology',
  chemistry: 'Chemistry',
  microbiology: 'Microbiology',
  data_science: 'Data Science',
  medicine: 'Medicine',
  gmat: 'GMAT',
  gre: 'GRE',
  a_level: 'A-Level',
  gcse: 'GCSE',
  general_knowledge: 'General Knowledge',
  physics: 'Physics',
  mathematics: 'Mathematics',
  sports: 'Sports',
};

export default function Quiz() {
  const { mode, category } = useParams();
  const { user, profile, consumeFreePlay } = useAuth();
  const audio = useAudio();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<'pending' | 'correct' | 'wrong'>('pending');
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerPaused, setTimerPaused] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [moneyWon, setMoneyWon] = useState(0);
  const [lifelines, setLifelines] = useState({ fiftyFifty: false, askAI: false, skip: false });
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);
  const [showAIHint, setShowAIHint] = useState(false);
  const [answersHistory, setAnswersHistory] = useState<{ question_id: string; selected: string; correct: string; is_correct: boolean }[]>([]);
  const [quizSaved, setQuizSaved] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  // Soft login wall state
  const [showLoginWall, setShowLoginWall] = useState(false);
  const [loginWallSkipped, setLoginWallSkipped] = useState(false);
  const [loginWallShown, setLoginWallShown] = useState(false);
  
  // Free Q3 wall — shown to anonymous users who just completed Q3
  const [showFreeWall, setShowFreeWall] = useState(false);
  const [freeWallShown, setFreeWallShown] = useState(false);
  const [showFreePlaysExhausted, setShowFreePlaysExhausted] = useState(false);
  
  const narrationTimeoutRef = useRef<number | null>(null);
  const lastNarratedQuestionId = useRef<string | null>(null);

  const categoryLabel = mode === 'wwtbam' ? 'Millionaire Arena' : (category ? CATEGORY_LABELS[category] || category : 'Quiz');
  const isAnonymous = !user;
  const scoreNotSaved = isAnonymous || loginWallSkipped;

  // Session-level pack label (shown as small badge)
  const [packLabel, setPackLabel] = useState<string>('standard');

  // Option shuffle hook — must be called unconditionally (before any early returns)
  const { getShuffledOptions, toOriginal, toDisplay } = useOptionShuffle(questions.length);

  // Fetch questions using smart rotation RPC (difficulty progression + no repeats)
  useEffect(() => {
    const fetchQuestions = async () => {
      const isPremium = false; // Will be updated when profile is available
      const categoryParam = mode === 'category' && category ? category : null;

      if (user) {
        // Logged-in: use smart RPC with seen-question tracking + difficulty progression
        const { data, error } = await supabase.rpc('get_quiz_session_questions', {
          p_user_id: user.id,
          p_category: categoryParam,
          p_is_premium: isPremium,
        });

        if (data && data.length >= 15) {
          setQuestions(data);
          // Set pack label from first question
          if (data[0]?.pack_label) setPackLabel(data[0].pack_label);
          
          // DEV: debug log for question engine
          if (import.meta.env.DEV) {
            console.log(`[QuestionEngine] Fetched ${data.length} questions via RPC`);
            console.log(`[QuestionEngine] Pack: ${data[0]?.pack_label}, Difficulties: ${data.map((q: any) => q.difficulty_level).join(',')}`);
          }
        } else {
          // Fallback: if RPC returns too few, use public view
          if (import.meta.env.DEV) {
            console.warn(`[QuestionEngine] RPC returned ${data?.length ?? 0} questions (error: ${error?.message}), falling back to public view`);
          }
          await fallbackFetch(categoryParam);
        }
      } else {
        // Anonymous: use public view (no tracking)
        await fallbackFetch(categoryParam);
      }

      setLoading(false);
    };

    const fallbackFetch = async (categoryParam: string | null) => {
      let query = supabase.from('quiz_questions_public').select('*');
      if (categoryParam) {
        query = query.eq('category', categoryParam as Database['public']['Enums']['question_category']);
      }
      const { data } = await query.limit(50);
      if (data && data.length >= 15) {
        const sorted = data.sort(() => Math.random() - 0.5).slice(0, 15)
          .sort((a, b) => (a.difficulty_level ?? 0) - (b.difficulty_level ?? 0));
        setQuestions(sorted);
        setPackLabel('standard');
      }
    };

    fetchQuestions();
  }, [mode, category, user]);

  // Start narration when question changes (and game has started)
  // Uses a ref guard to ensure TTS fires only ONCE per question ID
  // IMPORTANT: Bypasses context to avoid stale closure issues with voiceEnabled
  useEffect(() => {
    if (!hasStarted || gameOver || loading || showLoginWall || !questions[currentIndex]) return;
    
    const questionId = questions[currentIndex].id;
    if (lastNarratedQuestionId.current === questionId) return; // Already read this question
    lastNarratedQuestionId.current = questionId;
    
    voiceReader.cancel();
    if (narrationTimeoutRef.current) {
      clearTimeout(narrationTimeoutRef.current);
    }
    
    setTimerPaused(true);
    
    // Fallback timer — start the countdown even if voice doesn't fire
    narrationTimeoutRef.current = window.setTimeout(() => {
      setTimerPaused(false);
    }, 3000);

    // Read settings directly to avoid stale closure
    const settings = audioManager.getSettings();
    if (settings.voiceEnabled && voiceReader.isSupported()) {
      voiceReader.speakQuestion(
        questions[currentIndex],
        currentIndex + 1,
        settings.voiceSpeed,
        () => {
          if (narrationTimeoutRef.current) {
            clearTimeout(narrationTimeoutRef.current);
          }
          setTimerPaused(false);
        }
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, hasStarted, loading, showLoginWall, gameOver]);

  // Show free wall after Q3 for anonymous users (not yet shown)
  useEffect(() => {
    if (
      !user &&
      !freeWallShown &&
      currentIndex === FREE_WALL_AFTER_QUESTION &&
      hasStarted &&
      answerState === 'pending' &&
      !gameOver
    ) {
      setShowFreeWall(true);
      setFreeWallShown(true);
      setTimerPaused(true);
    }
  }, [currentIndex, user, freeWallShown, hasStarted, answerState, gameOver]);

  // Show soft login wall after Q5 for anonymous users who skipped the free wall
  useEffect(() => {
    if (
      !user &&
      !loginWallShown &&
      currentIndex === LOGIN_WALL_AFTER_QUESTION &&
      hasStarted &&
      answerState === 'pending' &&
      !gameOver
    ) {
      setShowLoginWall(true);
      setLoginWallShown(true);
      setTimerPaused(true);
    }
  }, [currentIndex, user, loginWallShown, hasStarted, answerState, gameOver]);

  // Save quiz run to database when game ends (only for logged-in users)
  useEffect(() => {
    const saveQuizRun = async () => {
      if (!gameOver || quizSaved || !user) return;
      
      const outcome = currentIndex >= 14 && moneyWon === 1000000 ? 'completed' : 
                      timeLeft === 0 ? 'timeout' : 'failed';
      
      const { error } = await supabase.from('quiz_runs').insert({
        user_id: user.id,
        mode: mode as 'category' | 'wwtbam' | 'fifa_exam',
        chosen_category: mode === 'category' ? category as any : null,
        money_won: moneyWon,
        current_question_index: currentIndex + 1,
        outcome,
        answers: answersHistory,
        lifelines_used: {
          fifty_fifty: lifelines.fiftyFifty,
          ask_ai: lifelines.askAI,
          skip: lifelines.skip,
          time_freeze: false,
        },
        completed_at: new Date().toISOString(),
      });
      
      if (!error) {
        setQuizSaved(true);
        // Refresh this user's leaderboard entries
        await supabase.rpc('refresh_user_leaderboard', { p_user_id: user.id });
      }
    };

    saveQuizRun();
  }, [gameOver, quizSaved, user, mode, category, moneyWon, currentIndex, answersHistory, lifelines, timeLeft]);

  // Resume music when game ends
  useEffect(() => {
    if (gameOver) {
      audio.cancelSpeech();
      if (narrationTimeoutRef.current) {
        clearTimeout(narrationTimeoutRef.current);
      }
      setTimeout(() => {
        audio.playBgMusic();
      }, 500);
    }
  }, [gameOver, audio]);

  // Timer
  useEffect(() => {
    if (gameOver || loading || answerState !== 'pending' || timerPaused || showLoginWall) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { 
          setGameOver(true); 
          audio.pauseBgMusic();
          return 0; 
        }
        if (t <= 11 && t > 1) {
          audio.playSfx('tick');
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver, loading, answerState, timerPaused, audio, showLoginWall]);

  // Initialize audio on first interaction
  const handleStartGame = async () => {
    // Enforce free play limit for logged-in free users
    if (user && profile?.access_tier === 'free') {
      const { allowed, remaining } = await consumeFreePlay();
      if (!allowed) {
        setShowFreePlaysExhausted(true);
        return;
      }
    }

    setHasStarted(true);
    
    try {
      await audio.initAudio();
      setTimeout(() => {
        audio.playBgMusic();
      }, 100);
    } catch (e) {
      console.warn('Audio init failed, continuing without audio:', e);
    }
  };

  const handleAnswer = (option: string) => {
    if (answerState !== 'pending' || gameOver) return;
    setSelectedAnswer(option);
    audio.playSfx('lock');
  };

  const [verifyingAnswer, setVerifyingAnswer] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState<string | null>(null);
  const [currentCorrectOption, setCurrentCorrectOption] = useState<string | null>(null);

  const handleConfirmAnswer = async () => {
    if (!selectedAnswer || answerState !== 'pending' || gameOver || verifyingAnswer) return;
    
    audio.cancelSpeech();
    if (narrationTimeoutRef.current) {
      clearTimeout(narrationTimeoutRef.current);
      narrationTimeoutRef.current = null;
    }
    
    setTimerPaused(true);
    setVerifyingAnswer(true);
    
    // Map user's display selection back to original letter for server verification
    const originalAnswer = toOriginal(currentIndex, selectedAnswer as any);
    
    const { data: verifyResult, error } = await supabase.rpc('verify_quiz_answer', {
      question_id: questions[currentIndex].id,
      user_answer: originalAnswer
    });
    
    setVerifyingAnswer(false);
    
    if (error || !verifyResult || verifyResult.length === 0) {
      setAnswerState('wrong');
      audio.playSfx('wrong');
      setGameOver(true);
      return;
    }
    
    const { is_correct, correct_option, explanation } = verifyResult[0];
    // Map the correct option from original to display letter for UI highlighting
    const displayCorrect = toDisplay(currentIndex, correct_option);
    setCurrentCorrectOption(displayCorrect);
    setCurrentExplanation(explanation);
    
    setAnswersHistory(prev => [...prev, {
      question_id: questions[currentIndex].id,
      selected: originalAnswer,
      correct: correct_option,
      is_correct,
    }]);
    
    setTimeout(() => {
      setAnswerState(is_correct ? 'correct' : 'wrong');
      audio.playSfx(is_correct ? 'correct' : 'wrong');
      
      setTimeout(() => {
        if (is_correct) {
          const newMoney = MONEY_LADDER[currentIndex];
          setMoneyWon(newMoney);
          audio.playSfx('levelup');
          
          if (currentIndex < 14) {
            audio.cancelSpeech();
            setCurrentIndex(i => i + 1);
            setSelectedAnswer(null);
            setAnswerState('pending');
            setTimeLeft(30);
            setHiddenOptions([]);
            setTimerPaused(true);
            setCurrentCorrectOption(null);
            setCurrentExplanation(null);
          } else {
            setGameOver(true);
          }
        } else {
          const guaranteed = currentIndex >= 10 ? 32000 : currentIndex >= 5 ? 1000 : 0;
          setMoneyWon(guaranteed);
          setGameOver(true);
        }
      }, 1500);
    }, 800);
  };

  const [fiftyFiftyLoading, setFiftyFiftyLoading] = useState(false);

  const useFiftyFifty = async () => {
    if (lifelines.fiftyFifty || fiftyFiftyLoading) return;
    setFiftyFiftyLoading(true);
    
    const { data: verifyResult, error } = await supabase.rpc('verify_quiz_answer', {
      question_id: questions[currentIndex].id,
      user_answer: 'A'
    });
    
    setFiftyFiftyLoading(false);
    
    if (error || !verifyResult || verifyResult.length === 0) return;
    
    setLifelines(l => ({ ...l, fiftyFifty: true }));
    const correctOriginal = verifyResult[0].correct_option;
    // Map correct to display letter, then hide 2 of the other 3 display letters
    const correctDisplay = toDisplay(currentIndex, correctOriginal);
    const otherDisplayLetters = (['A', 'B', 'C', 'D'] as const).filter(o => o !== correctDisplay);
    const toHide = otherDisplayLetters.sort(() => Math.random() - 0.5).slice(0, 2);
    setHiddenOptions(toHide);
  };

  const useSkip = () => {
    if (lifelines.skip || currentIndex >= 14) return;
    
    audio.cancelSpeech();
    if (narrationTimeoutRef.current) {
      clearTimeout(narrationTimeoutRef.current);
    }
    
    setLifelines(l => ({ ...l, skip: true }));
    setCurrentIndex(i => i + 1);
    setTimeLeft(30);
    setHiddenOptions([]);
    setTimerPaused(true);
  };

  const [aiHintLoading, setAiHintLoading] = useState(false);
  const [aiHintText, setAiHintText] = useState<string | null>(null);

  const useAskAI = async () => {
    if (lifelines.askAI || aiHintLoading) return;
    setAiHintLoading(true);
    setLifelines(l => ({ ...l, askAI: true }));
    
    const { data: verifyResult, error } = await supabase.rpc('verify_quiz_answer', {
      question_id: questions[currentIndex].id,
      user_answer: 'A'
    });
    
    setAiHintLoading(false);
    
    if (error || !verifyResult || verifyResult.length === 0) {
      setAiHintText("Think carefully about the question. Consider what you know about this topic and eliminate options that don't fit.");
    } else {
      setAiHintText(verifyResult[0].explanation || "Think carefully about the question. Consider what you know about this topic and eliminate options that don't fit.");
    }
    
    setShowAIHint(true);
  };

  // Soft login wall handlers
  const handleLoginWallSkip = () => {
    setShowLoginWall(false);
    setLoginWallSkipped(true);
    setTimerPaused(false);
  };

  const handleLoginWallSuccess = () => {
    setShowLoginWall(false);
    setTimerPaused(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audio.cancelSpeech();
      audio.pauseBgMusic();
      if (narrationTimeoutRef.current) {
        clearTimeout(narrationTimeoutRef.current);
      }
    };
  }, [audio]);

  if (loading) {
    return (
      <div className="min-h-screen stage-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (questions.length < 15) {
    return (
      <div className="min-h-screen stage-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Not enough questions available</p>
          <Link to="/categories"><Button className="btn-gold">Back to Categories</Button></Link>
        </div>
      </div>
    );
  }

  // Start screen
  if (!hasStarted) {
    return (
      <div className="min-h-screen stage-background flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center animate-scale-in">
          <Crown className="w-16 h-16 text-accent mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2 gradient-text-gold">{categoryLabel}</h1>
          <p className="text-muted-foreground mb-6">
            Answer 15 questions to win up to $1,000,000!
          </p>
          <Button onClick={handleStartGame} className="btn-gold w-full py-6 text-lg">
            🎮 Start Quiz
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            🔊 Sound will be enabled when you start
          </p>
          {/* Social proof */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5 text-accent" />
            <span>1,248 players played today</span>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  // Game Over screen
  if (gameOver) {
    return (
      <div className="min-h-screen stage-background flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center animate-scale-in">
          <Crown className="w-16 h-16 text-accent mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Game Over!</h1>
          <p className="text-5xl font-black gradient-text-gold mb-4">${moneyWon.toLocaleString()}</p>
          <p className="text-muted-foreground mb-4">You answered {currentIndex} questions</p>

          {/* Score not saved warning for anonymous / skipped users */}
          {scoreNotSaved && (
            <div className="mb-6 p-4 rounded-xl bg-wrong/10 border border-wrong/30">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-wrong" />
                <span className="font-bold text-wrong">Score Not Saved</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Save your score and climb the leaderboard.
              </p>
              <Link to="/auth">
                <CTAButton label="Save My Score" subtext="Create a free account" fullWidth />
              </Link>
            </div>
          )}

          {/* Score percentile ego trigger */}
          {moneyWon >= 300 && (
            <div className="mb-6 p-3 rounded-xl bg-accent/10 border border-accent/30">
              <p className="text-sm text-accent font-semibold">
                🔥 You scored higher than <strong>
                  {moneyWon >= 32000 ? '95' : moneyWon >= 8000 ? '85' : moneyWon >= 1000 ? '78' : '60'}%
                </strong> of players today.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Unlock leaderboards to see your global rank →
              </p>
            </div>
          )}

          {/* Social proof */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-6">
            <Users className="w-3.5 h-3.5 text-accent" />
            <span>1,248 players competed today</span>
          </div>

          <div className="flex gap-4">
            <Link to="/categories" className="flex-1"><Button className="w-full btn-purple">Play Again</Button></Link>
            <Link to="/leaderboards" className="flex-1"><Button variant="outline" className="w-full">Leaderboards</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen stage-background relative overflow-hidden flex flex-col">
      <div className="glow-orb glow-orb-purple w-96 h-96 top-10 left-10 opacity-20" />

      {/* Score not saved banner */}
      {scoreNotSaved && hasStarted && (
        <div className="relative z-20 bg-accent/15 border-b border-accent/40 py-2 px-4 text-center">
          <span className="text-sm text-accent font-bold tracking-wide">
            ⚠️ Playing as Guest — Score won't be saved • 
            <Link to="/auth" className="underline ml-1 hover:text-accent-bright">Sign in</Link>
          </span>
        </div>
      )}

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
        <div className="flex gap-6 w-full max-w-5xl h-full max-h-[700px]">
          {/* Money Ladder - Desktop */}
          <aside className="hidden lg:flex w-44 flex-shrink-0">
            <MoneyLadder currentIndex={currentIndex} />
          </aside>

          {/* Quiz Content */}
          <div className="flex-1 flex flex-col justify-between">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Link to="/categories" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-bold gradient-text-gold">{categoryLabel}</h1>
                <span className="px-4 py-1.5 rounded-full bg-primary/30 text-sm font-medium">
                  Question {currentIndex + 1} of 15
                </span>
                <span className="px-4 py-1.5 rounded-full bg-card/50 text-sm text-muted-foreground hidden md:inline-block">
                  Difficulty: {currentQ.difficulty_level}
                </span>
                {packLabel !== 'standard' && (
                  <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium hidden md:inline-block">
                    {packLabel === 'daily' ? '📦 Daily Pack' : packLabel === 'weekly' ? '📦 Weekly Challenge' : packLabel === 'weekly_premium' ? '👑 Premium Weekly' : ''}
                  </span>
                )}
              </div>
              <div className={`flex items-center justify-center w-16 h-16 rounded-full border-4 ${
                timerPaused ? 'border-muted text-muted-foreground' :
                timeLeft <= 10 ? 'border-wrong text-wrong animate-pulse' : 
                timeLeft <= 20 ? 'border-accent text-accent' : 'border-correct text-correct'
              }`}>
                <span className="text-2xl font-bold">{timerPaused ? '⏸' : timeLeft}</span>
              </div>
            </div>

            {/* Voice Controls */}
            <div className="mb-4">
              <AudioControls currentQuestion={currentQ} questionNumber={currentIndex + 1} />
            </div>

            {/* Question */}
            <div className="glass-card rounded-2xl p-6 mb-5">
              <h2 className="text-xl md:text-2xl font-semibold text-center leading-relaxed">{currentQ.stem}</h2>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              {getShuffledOptions(currentIndex, currentQ).map(({ displayLabel, text }) => {
                const isHidden = hiddenOptions.includes(displayLabel);
                const isSelected = selectedAnswer === displayLabel;
                const isCorrect = answerState !== 'pending' && currentCorrectOption === displayLabel;
                const isWrong = answerState === 'wrong' && isSelected;
                
                return (
                  <button
                    key={displayLabel}
                    onClick={() => handleAnswer(displayLabel)}
                    disabled={isHidden || answerState !== 'pending' || verifyingAnswer}
                    className={`answer-option py-4 px-5 text-base ${isHidden ? 'disabled' : ''} ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                  >
                    <span className="font-bold text-accent mr-3">{displayLabel}:</span>
                    {text}
                  </button>
                );
              })}
            </div>

            {/* Confirm Answer Button */}
            {selectedAnswer && answerState === 'pending' && (
              <div className="flex justify-center mb-5">
                <Button 
                  onClick={handleConfirmAnswer}
                  disabled={verifyingAnswer}
                  className="btn-gold px-8 py-3 text-lg font-bold"
                >
                  {verifyingAnswer ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : null}
                  {verifyingAnswer ? 'Checking...' : 'Next Question →'}
                </Button>
              </div>
            )}

            {/* Lifelines */}
            <div className="flex justify-center gap-3">
              <button 
                onClick={useFiftyFifty} 
                disabled={fiftyFiftyLoading}
                className={`lifeline-btn-compact ${lifelines.fiftyFifty ? 'used' : ''} ${fiftyFiftyLoading ? 'opacity-50' : ''}`}
              >
                {fiftyFiftyLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                <span>50:50</span>
              </button>
              <button 
                onClick={useAskAI} 
                disabled={aiHintLoading}
                className={`lifeline-btn-compact ${lifelines.askAI ? 'used' : ''} ${aiHintLoading ? 'opacity-50' : ''}`}
              >
                {aiHintLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                <span>Ask AI</span>
              </button>
              <button onClick={useSkip} className={`lifeline-btn-compact ${lifelines.skip ? 'used' : ''}`}>
                <SkipForward className="w-5 h-5" />
                <span>Skip</span>
              </button>
            </div>

            {/* Money Ladder - Mobile */}
            <div className="lg:hidden mt-5">
              <details className="glass-card rounded-xl p-3">
                <summary className="flex items-center justify-between cursor-pointer text-sm font-medium">
                  <span>Money Ladder</span>
                  <span className="text-accent">${MONEY_LADDER[currentIndex].toLocaleString()}</span>
                </summary>
                <div className="mt-3">
                  <MoneyLadder currentIndex={currentIndex} />
                </div>
              </details>
            </div>
          </div>
        </div>
      </main>

      {/* Ask AI Hint Modal */}
      <Dialog open={showAIHint} onOpenChange={setShowAIHint}>
        <DialogContent className="glass-card border-accent/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Lightbulb className="w-6 h-6 text-accent" />
              <span className="gradient-text-gold">AI Hint</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Here's a helpful hint to guide you:
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 rounded-xl bg-primary/20 border border-accent/20">
            <p className="text-foreground leading-relaxed">
              {aiHintText || "Think carefully about the question. Consider what you know about this topic and eliminate options that don't fit."}
            </p>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setShowAIHint(false)} className="btn-gold">
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Soft Login Wall */}
      <SoftLoginWall
        open={showLoginWall}
        onClose={() => setShowLoginWall(false)}
        onSkip={handleLoginWallSkip}
        onSuccess={handleLoginWallSuccess}
        currentScore={moneyWon}
        questionsAnswered={currentIndex}
        canSkip={!loginWallSkipped}
      />

      {/* Free Trial Upgrade Modal — shown after Q3 for anonymous users */}
      <FreeTrialUpgradeModal
        open={showFreeWall}
        onClose={() => {
          setShowFreeWall(false);
          setTimerPaused(false);
        }}
      />

      {/* Free plays exhausted modal — shown when logged-in free user has 0 plays left */}
      <FreePlaysExhaustedModal open={showFreePlaysExhausted} />
    </div>
  );
}
