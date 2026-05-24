import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Crown, ArrowLeft, Lock, Timer, CheckCircle2, XCircle, 
  Trophy, AlertTriangle, Play, RotateCcw, Volume2, VolumeX,
  ChevronLeft, ChevronRight, Send, Eye
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { voiceReader } from '@/lib/audio';
import { useOptionShuffle } from '@/hooks/useOptionShuffle';

// FIFA Exam Categories
const FIFA_CATEGORIES = [
  'fifa_regulations',
  'player_transfers', 
  'agent_ethics',
  'representation_conflicts'
] as const;

type FifaCategory = typeof FIFA_CATEGORIES[number];

interface Question {
  id: string;
  stem: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string | null;
  category: string;
}

type ExamState = 'intro' | 'exam' | 'review' | 'results';

export default function FifaExam() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [examState, setExamState] = useState<ExamState>('intro');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, string>>(new Map()); // questionIndex -> selectedOption
  const [timeRemaining, setTimeRemaining] = useState(20 * 60); // 20 minutes in seconds
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isReading, setIsReading] = useState(false);
  const hasReadCurrentQuestion = useRef(false);

  const isPremium = profile?.access_tier === 'premium';

  const { getShuffledOptions, toOriginal, toDisplay } = useOptionShuffle(questions.length);

  // Redirect non-premium users
  useEffect(() => {
    if (profile && !isPremium) {
      navigate('/settings');
    }
  }, [profile, isPremium, navigate]);

  // Timer logic - runs during exam and review
  useEffect(() => {
    if ((examState !== 'exam' && examState !== 'review') || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examState, timeRemaining]);

  // Voice reading for current question
  const readCurrentQuestion = useCallback(() => {
    if (!voiceEnabled || !questions[currentIndex] || (examState !== 'exam' && examState !== 'review')) return;
    
    setIsReading(true);
    const question = questions[currentIndex];
    
    voiceReader.speakQuestion(
      {
        stem: question.stem,
        option_a: question.option_a,
        option_b: question.option_b,
        option_c: question.option_c,
        option_d: question.option_d,
      },
      currentIndex + 1,
      1.0,
      () => setIsReading(false),
      20 // FIFA exam has 20 questions
    );
  }, [voiceEnabled, questions, currentIndex, examState]);

  // Auto-read question when it changes
  useEffect(() => {
    if ((examState === 'exam' || examState === 'review') && questions.length > 0 && voiceEnabled && !hasReadCurrentQuestion.current) {
      hasReadCurrentQuestion.current = true;
      const timer = setTimeout(() => readCurrentQuestion(), 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, examState, questions.length, voiceEnabled, readCurrentQuestion]);

  // Reset the read flag when question changes
  useEffect(() => {
    hasReadCurrentQuestion.current = false;
  }, [currentIndex]);

  // Cancel voice on cleanup or state change
  useEffect(() => {
    return () => voiceReader.cancel();
  }, [examState]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const allQuestions: Question[] = [];
      
      for (const category of FIFA_CATEGORIES) {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('category', category)
          .eq('is_active', true)
          .limit(5);

        if (error) throw error;
        if (data) allQuestions.push(...(data as Question[]));
      }

      const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, 20);
      setQuestions(shuffled);
      setAnswers(new Map());
      setCurrentIndex(0);
      setTimeRemaining(20 * 60); // 20 minutes
      setExamState('exam');
    } catch (error) {
      toast({
        title: "Error loading questions",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (option: string) => {
    setAnswers(prev => new Map(prev).set(currentIndex, option));
  };

  const handlePreviousQuestion = () => {
    voiceReader.cancel();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      hasReadCurrentQuestion.current = false;
    }
  };

  const handleNextQuestion = () => {
    voiceReader.cancel();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      hasReadCurrentQuestion.current = false;
    }
  };

  const handleGoToReview = () => {
    voiceReader.cancel();
    setExamState('review');
    setCurrentIndex(0);
  };

  const handleGoToQuestion = (index: number) => {
    voiceReader.cancel();
    setCurrentIndex(index);
    if (examState === 'review') {
      setExamState('exam');
    }
  };

  const handleFinalSubmit = useCallback(() => {
    voiceReader.cancel();
    setExamState('results');
  }, []);

  const toggleVoice = () => {
    if (voiceEnabled) {
      voiceReader.cancel();
      setIsReading(false);
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, index) => {
      const displayLetter = answers.get(index);
      if (!displayLetter) return;
      // Map display letter back to original to compare with stored correct_option
      const originalLetter = toOriginal(index, displayLetter as any);
      if (originalLetter === q.correct_option) {
        correct++;
      }
    });
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100)
    };
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      'fifa_regulations': 'FIFA Football Agent Regulations',
      'player_transfers': 'Player Transfers',
      'agent_ethics': 'Agent Conduct & Ethics',
      'representation_conflicts': 'Representation & Conflicts of Interest'
    };
    return names[category] || category;
  };

  const getAnsweredCount = () => answers.size;
  const getUnansweredCount = () => questions.length - answers.size;

  if (!isPremium) {
    return (
      <div className="min-h-screen stage-background flex items-center justify-center p-6">
        <Card className="glass-card border-accent/30 max-w-md">
          <CardContent className="p-8 text-center">
            <Lock className="w-16 h-16 text-accent mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Premium Feature</h2>
            <p className="text-muted-foreground mb-6">
              Upgrade to Premium to unlock FIFA Agent Exam Practice
            </p>
            <Button onClick={() => navigate('/settings')} className="bg-accent text-accent-foreground">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium - $20
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen stage-background relative overflow-hidden">
      {/* Spotlight effects */}
      <div className="glow-orb glow-orb-purple w-96 h-96 top-10 left-10 opacity-30" />
      <div className="glow-orb glow-orb-gold w-64 h-64 bottom-20 right-20 opacity-20" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
        <Link to="/categories" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <Crown className="w-6 h-6 text-accent" />
          <span className="font-bold gradient-text-gold">QuizMaster</span>
        </Link>
        
        {(examState === 'exam' || examState === 'review') && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            timeRemaining < 120 ? 'bg-destructive/20 text-destructive animate-pulse' : 
            timeRemaining < 300 ? 'bg-destructive/20 text-destructive' : 'bg-accent/20 text-accent'
          }`}>
            <Timer className="w-5 h-5" />
            <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
          </div>
        )}
      </nav>

      <main className="relative z-10 container mx-auto px-6 py-8">
        {/* Intro State */}
        {examState === 'intro' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium mb-4">
                <Crown className="w-4 h-4" />
                Premium Exclusive
              </div>
              <h1 className="text-4xl font-bold gradient-text-gold mb-4">FIFA Agent Exam Practice</h1>
              <p className="text-muted-foreground">
                Prepare for your FIFA Football Agent Examination with our comprehensive mock exam.
              </p>
            </div>

            <Card className="glass-card border-accent/30 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-accent" />
                  Exam Format
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10">
                    <div className="text-2xl font-bold text-accent">20</div>
                    <div className="text-sm text-muted-foreground">Questions</div>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10">
                    <div className="text-2xl font-bold text-accent">20</div>
                    <div className="text-sm text-muted-foreground">Minutes</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Exam Rules:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Navigate freely between questions</li>
                    <li>• Change answers anytime before submission</li>
                    <li>• Review all answers before final submit</li>
                    <li>• See explanations after submission</li>
                    <li>• 75% required to pass</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Topics Covered:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• FIFA Football Agent Regulations</li>
                    <li>• Player Transfers</li>
                    <li>• Agent Conduct & Ethics</li>
                    <li>• Representation & Conflicts of Interest</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={fetchQuestions} 
              disabled={loading}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-14 text-lg"
            >
              {loading ? (
                <span className="animate-pulse">Loading Questions...</span>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Start Mock Exam
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-6 max-w-md mx-auto">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              This is an independent preparation resource and is not affiliated with or endorsed by FIFA.
            </p>
          </div>
        )}

        {/* Exam State */}
        {examState === 'exam' && questions.length > 0 && (
          <div className="max-w-4xl mx-auto">
            {/* Question Navigator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleVoice}
                    className={`p-2 rounded-full transition-colors ${
                      voiceEnabled ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-muted-foreground'
                    }`}
                    title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
                  >
                    {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/20">
                    {getCategoryName(questions[currentIndex].category)}
                  </span>
                </div>
              </div>

              {/* Question Grid Navigator */}
              <div className="flex flex-wrap gap-2 mb-4">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                      index === currentIndex
                        ? 'bg-accent text-accent-foreground shadow-gold-glow'
                        : answers.has(index)
                          ? 'bg-green-500/30 text-green-400 border border-green-500/50'
                          : 'bg-primary/20 text-muted-foreground hover:bg-primary/30'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {/* Progress bar */}
              <div className="h-3 bg-primary/30 rounded-full overflow-hidden border border-accent/20">
                <div 
                  className="h-full bg-gradient-to-r from-accent to-yellow-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,215,0,0.5)]"
                  style={{ width: `${(getAnsweredCount() / questions.length) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>{getAnsweredCount()} answered</span>
                <span>{getUnansweredCount()} remaining</span>
              </div>
            </div>

            <Card className="glass-card border-accent/30">
              <CardContent className="p-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <h2 className="text-xl font-semibold flex-1">
                    {questions[currentIndex].stem}
                  </h2>
                  {voiceEnabled && (
                    <button
                      onClick={readCurrentQuestion}
                      disabled={isReading}
                      className={`p-2 rounded-full shrink-0 transition-all ${
                        isReading 
                          ? 'bg-accent text-accent-foreground animate-pulse' 
                          : 'bg-accent/20 text-accent hover:bg-accent/30'
                      }`}
                      title="Read question aloud"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {getShuffledOptions(currentIndex, questions[currentIndex]).map(({ displayLabel, text }) => {
                    const isSelected = answers.get(currentIndex) === displayLabel;

                    return (
                      <button
                        key={displayLabel}
                        onClick={() => handleSelectOption(displayLabel)}
                        className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                          isSelected
                            ? 'bg-gradient-to-r from-accent/30 to-yellow-500/30 border-2 border-accent shadow-[0_0_20px_rgba(255,215,0,0.4)]'
                            : 'bg-primary/10 border-2 border-transparent hover:bg-primary/20 hover:border-accent/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${
                            isSelected
                              ? 'bg-gradient-to-br from-accent to-yellow-500 text-accent-foreground shadow-[0_0_10px_rgba(255,215,0,0.5)]'
                              : 'bg-primary/20'
                          }`}>
                            {displayLabel}
                          </span>
                          <span>{text}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-8 flex items-center justify-between gap-4">
                  <Button
                    onClick={handlePreviousQuestion}
                    disabled={currentIndex === 0}
                    variant="outline"
                    className="flex-1"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  
                  {currentIndex < questions.length - 1 ? (
                    <Button
                      onClick={handleNextQuestion}
                      className="flex-1 bg-accent text-accent-foreground"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleGoToReview}
                      className="flex-1 bg-accent text-accent-foreground"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review Answers
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Review State */}
        {examState === 'review' && questions.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold gradient-text-gold mb-2">Review Your Answers</h1>
              <p className="text-muted-foreground">
                Check your answers before final submission. Click any question to change your answer.
              </p>
            </div>

            <Card className="glass-card border-accent/30 mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/30">
                    <div className="text-2xl font-bold text-green-400">{getAnsweredCount()}</div>
                    <div className="text-sm text-muted-foreground">Answered</div>
                  </div>
                  <div className="p-4 rounded-lg bg-destructive/20 border border-destructive/30">
                    <div className="text-2xl font-bold text-destructive">{getUnansweredCount()}</div>
                    <div className="text-sm text-muted-foreground">Unanswered</div>
                  </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {questions.map((question, index) => {
                    const selectedDisplayLetter = answers.get(index);
                    // Map display letter to get the text for display
                    const shuffledOpts = getShuffledOptions(index, question);
                    const selectedOpt = shuffledOpts.find(o => o.displayLabel === selectedDisplayLetter);
                    const selectedText = selectedOpt?.text ?? null;

                    return (
                      <button
                        key={index}
                        onClick={() => handleGoToQuestion(index)}
                        className={`w-full p-4 rounded-xl text-left transition-all ${
                          selectedDisplayLetter
                            ? 'bg-green-500/10 border border-green-500/30 hover:bg-green-500/20'
                            : 'bg-destructive/10 border border-destructive/30 hover:bg-destructive/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                            selectedDisplayLetter ? 'bg-green-500/30 text-green-400' : 'bg-destructive/30 text-destructive'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{question.stem}</p>
                            {selectedDisplayLetter ? (
                              <p className="text-xs text-green-400 mt-1">
                                Selected: {selectedDisplayLetter}. {selectedText?.substring(0, 50)}...
                              </p>
                            ) : (
                              <p className="text-xs text-destructive mt-1">Not answered</p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                onClick={() => setExamState('exam')}
                variant="outline"
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Questions
              </Button>
              <Button
                onClick={handleFinalSubmit}
                className="flex-1 bg-accent text-accent-foreground"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Exam
              </Button>
            </div>

            {getUnansweredCount() > 0 && (
              <p className="text-sm text-destructive text-center mt-4">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                You have {getUnansweredCount()} unanswered question(s). Unanswered questions will be marked as incorrect.
              </p>
            )}
          </div>
        )}

        {/* Results State */}
        {examState === 'results' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold gradient-text-gold mb-4">Exam Complete!</h1>
            </div>

            <Card className="glass-card border-accent/30 mb-6">
              <CardContent className="p-8 text-center">
                {(() => {
                  const score = calculateScore();
                  const passed = score.percentage >= 75;
                  
                  return (
                    <>
                      <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${
                        passed ? 'bg-green-500/20' : 'bg-destructive/20'
                      }`}>
                        {passed ? (
                          <Trophy className="w-12 h-12 text-green-500" />
                        ) : (
                          <XCircle className="w-12 h-12 text-destructive" />
                        )}
                      </div>
                      
                      <div className="text-5xl font-bold mb-2">
                        {score.percentage}%
                      </div>
                      <div className="text-muted-foreground mb-4">
                        {score.correct} out of {score.total} correct
                      </div>
                      
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                        passed ? 'bg-green-500/20 text-green-400' : 'bg-destructive/20 text-destructive'
                      }`}>
                        {passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-4">
                        {passed 
                          ? 'Great job! You\'re well-prepared for the FIFA Agent Exam.'
                          : 'Keep practicing! You need 75% to pass the real exam.'}
                      </p>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Detailed Results with Explanations */}
            <Card className="glass-card border-accent/30 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-accent" />
                  Question Review & Explanations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 max-h-[600px] overflow-y-auto">
                {questions.map((question, index) => {
                  const selectedDisplayLetter = answers.get(index);
                  const selectedOriginal = selectedDisplayLetter ? toOriginal(index, selectedDisplayLetter as any) : null;
                  const isCorrect = selectedOriginal === question.correct_option;
                  
                  // Get texts via shuffle map
                  const shuffledOpts = getShuffledOptions(index, question);
                  const correctDisplayLetter = toDisplay(index, question.correct_option);
                  const correctOpt = shuffledOpts.find(o => o.displayLabel === correctDisplayLetter);
                  const correctText = correctOpt?.text ?? '';
                  const selectedOpt = shuffledOpts.find(o => o.displayLabel === selectedDisplayLetter);
                  const selectedText = selectedOpt?.text ?? null;

                  return (
                    <div 
                      key={index}
                      className={`p-4 rounded-xl border ${
                        isCorrect 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-destructive/10 border-destructive/30'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                          isCorrect ? 'bg-green-500 text-white' : 'bg-destructive text-white'
                        }`}>
                          {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </span>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Question {index + 1}</p>
                          <p className="font-medium">{question.stem}</p>
                        </div>
                      </div>

                      <div className="ml-11 space-y-2">
                        {selectedDisplayLetter ? (
                          <div className={`p-3 rounded-lg ${isCorrect ? 'bg-green-500/20' : 'bg-destructive/20'}`}>
                            <p className="text-sm">
                              <span className="font-semibold">Your answer:</span> {selectedDisplayLetter}. {selectedText}
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-destructive/20">
                            <p className="text-sm text-destructive">Not answered</p>
                          </div>
                        )}

                        {!isCorrect && (
                          <div className="p-3 rounded-lg bg-green-500/20">
                            <p className="text-sm text-green-400">
                              <span className="font-semibold">Correct answer:</span> {correctDisplayLetter}. {correctText}
                            </p>
                          </div>
                        )}

                        {question.explanation && (
                          <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                            <p className="text-xs font-semibold text-accent mb-1">Explanation</p>
                            <p className="text-sm text-muted-foreground">{question.explanation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button 
                onClick={() => setExamState('intro')}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Link to="/categories" className="flex-1">
                <Button className="w-full bg-accent text-accent-foreground">
                  Back to Categories
                </Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-6">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              This is an independent preparation resource and is not affiliated with or endorsed by FIFA.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
