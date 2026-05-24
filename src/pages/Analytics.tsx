import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Crown, BarChart3, ArrowLeft, Target, Flame, TrendingUp, Trophy, Clock, Loader2 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';

interface QuizRun {
  id: string;
  mode: string;
  chosen_category: string | null;
  money_won: number;
  current_question_index: number;
  outcome: string | null;
  answers: any[];
  started_at: string;
  completed_at: string | null;
  lifelines_used: {
    skip?: boolean;
    ask_ai?: boolean;
    fifty_fifty?: boolean;
    time_freeze?: boolean;
  };
}

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
  fifa_regulations: 'FIFA Regulations',
  player_transfers: 'Player Transfers',
  agent_ethics: 'Agent Ethics',
  representation_conflicts: 'Representation Conflicts',
};

export default function Analytics() {
  const { user } = useAuth();
  const [quizRuns, setQuizRuns] = useState<QuizRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('quiz_runs')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });
      
      if (data && !error) {
        setQuizRuns(data as QuizRun[]);
      }
      setLoading(false);
    };

    fetchAnalytics();
  }, [user]);

  // Calculate stats
  const stats = useMemo(() => {
    if (quizRuns.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        streak: 0,
        accuracy: 0,
        bestPerformance: 0,
        totalQuestions: 0,
        longestStreak: 0,
      };
    }

    const totalQuizzes = quizRuns.length;
    const totalQuestionsAnswered = quizRuns.reduce((sum, run) => sum + (run.answers?.length || 0), 0);
    const correctAnswers = quizRuns.reduce((sum, run) => {
      if (!run.answers) return sum;
      return sum + (run.answers as any[]).filter(a => a.is_correct).length;
    }, 0);
    const accuracy = totalQuestionsAnswered > 0 ? (correctAnswers / totalQuestionsAnswered) * 100 : 0;
    const averageScore = quizRuns.reduce((sum, run) => sum + run.current_question_index, 0) / totalQuizzes;
    const bestPerformance = Math.max(...quizRuns.map(run => run.current_question_index));

    // Calculate streak (consecutive days played)
    const uniqueDays = new Set(quizRuns.map(run => 
      new Date(run.started_at).toDateString()
    ));
    
    return {
      totalQuizzes,
      averageScore: Math.round(averageScore * 10) / 10,
      streak: uniqueDays.size > 0 ? Math.min(uniqueDays.size, 7) : 0, // Simplified streak
      accuracy: Math.round(accuracy * 10) / 10,
      bestPerformance,
      totalQuestions: totalQuestionsAnswered,
      longestStreak: uniqueDays.size,
    };
  }, [quizRuns]);

  // Performance by category
  const categoryData = useMemo(() => {
    const categoryStats: Record<string, { total: number; correct: number }> = {};
    
    quizRuns.forEach(run => {
      const cat = run.chosen_category || 'mixed';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { total: 0, correct: 0 };
      }
      
      if (run.answers) {
        (run.answers as any[]).forEach(a => {
          categoryStats[cat].total++;
          if (a.is_correct) categoryStats[cat].correct++;
        });
      }
    });

    return Object.entries(categoryStats)
      .map(([category, { total, correct }]) => ({
        category: CATEGORY_LABELS[category] || category,
        questions: total,
        correct,
        score: total > 0 ? Math.round((correct / total) * 15) : 0,
      }))
      .slice(0, 6);
  }, [quizRuns]);

  // Recent progress (last 10 quizzes)
  const recentProgress = useMemo(() => {
    return quizRuns.slice(0, 10).reverse().map((run, index) => ({
      name: `Quiz ${quizRuns.length - 9 + index}`,
      score: run.current_question_index,
      money: run.money_won,
    }));
  }, [quizRuns]);

  const chartConfig: ChartConfig = {
    score: {
      label: "Questions Answered",
      color: "hsl(var(--accent))",
    },
    questions: {
      label: "Questions",
      color: "hsl(var(--accent))",
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen stage-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen stage-background relative overflow-hidden">
      <div className="glow-orb glow-orb-purple w-96 h-96 top-10 left-10 opacity-30" />
      
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
        <Link to="/categories" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
          <Crown className="w-6 h-6 text-accent" />
          <span className="font-bold gradient-text-gold">QuizMaster</span>
        </Link>
      </nav>

      <main className="relative z-10 container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold gradient-text-gold mb-2">Performance Analytics</h1>
          <p className="text-muted-foreground">Track your progress and improve your skills</p>
        </div>
        
        {quizRuns.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 max-w-2xl mx-auto text-center">
            <BarChart3 className="w-16 h-16 text-accent mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No Quiz Data Yet</h2>
            <p className="text-muted-foreground mb-6">Play some quizzes to see your performance stats here.</p>
            <Link to="/categories" className="inline-block">
              <button className="btn-gold px-6 py-3">Start Playing</button>
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="glass-card rounded-xl p-5 relative overflow-hidden">
                <Badge className="absolute top-3 right-3 bg-primary/50 text-accent border-0">Total</Badge>
                <Trophy className="w-6 h-6 text-accent mb-2 opacity-70" />
                <p className="text-3xl font-bold text-accent">{stats.totalQuizzes}</p>
                <p className="text-sm text-muted-foreground">Quizzes</p>
              </div>
              
              <div className="glass-card rounded-xl p-5 relative overflow-hidden">
                <Badge className="absolute top-3 right-3 bg-primary/50 text-accent border-0">Avg</Badge>
                <Target className="w-6 h-6 text-accent mb-2 opacity-70" />
                <p className="text-3xl font-bold text-accent">{stats.averageScore}</p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
              
              <div className="glass-card rounded-xl p-5 relative overflow-hidden">
                <Badge className="absolute top-3 right-3 bg-primary/50 text-orange-400 border-0">Streak</Badge>
                <Flame className="w-6 h-6 text-orange-400 mb-2 opacity-70" />
                <p className="text-3xl font-bold text-orange-400">{stats.streak}</p>
                <p className="text-sm text-muted-foreground">Days</p>
              </div>
              
              <div className="glass-card rounded-xl p-5 relative overflow-hidden">
                <Badge className="absolute top-3 right-3 bg-primary/50 text-correct border-0">Rate</Badge>
                <TrendingUp className="w-6 h-6 text-correct mb-2 opacity-70" />
                <p className="text-3xl font-bold text-correct">{stats.accuracy}%</p>
                <p className="text-sm text-muted-foreground">Accuracy</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Performance by Category */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-semibold text-accent">Performance by Category</h3>
                </div>
                {categoryData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-64">
                    <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                      <XAxis 
                        dataKey="category" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={60}
                      />
                      <YAxis 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        domain={[0, 'auto']}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar 
                        dataKey="questions" 
                        fill="hsl(var(--accent))" 
                        radius={[4, 4, 0, 0]}
                        name="Questions"
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Not enough data yet
                  </div>
                )}
              </div>

              {/* Recent Progress */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-semibold text-accent">Recent Progress</h3>
                </div>
                {recentProgress.length > 1 ? (
                  <ChartContainer config={chartConfig} className="h-64">
                    <LineChart data={recentProgress} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      />
                      <YAxis 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        domain={[0, 15]}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2 }}
                        name="Score"
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Play more quizzes to see your progress
                  </div>
                )}
              </div>
            </div>

            {/* Quick Insights */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold text-accent mb-4">Quick Insights</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-primary/20 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Best Performance</p>
                  <p className="text-2xl font-bold text-accent">{stats.bestPerformance}/15</p>
                  <p className="text-xs text-muted-foreground">Personal best score</p>
                </div>
                <div className="bg-primary/20 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Longest Streak</p>
                  <p className="text-2xl font-bold text-orange-400">{stats.longestStreak} days</p>
                  <p className="text-xs text-muted-foreground">Keep it up!</p>
                </div>
                <div className="bg-primary/20 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Total Questions</p>
                  <p className="text-2xl font-bold text-correct">{stats.totalQuestions}</p>
                  <p className="text-xs text-muted-foreground">Questions answered</p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
