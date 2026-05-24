import { useNavigate } from 'react-router-dom';
import { CTAButton } from '@/components/CTAButton';
import { Brain, Trophy, Atom, Database } from 'lucide-react';

const FEATURED_CATEGORIES = [
  {
    id: 'general_knowledge',
    name: 'General Knowledge',
    icon: Brain,
    sampleQ: 'What is the largest ocean on Earth?',
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: Trophy,
    sampleQ: 'Which country has won the most FIFA World Cups?',
  },
  {
    id: 'physics',
    name: 'Science',
    icon: Atom,
    sampleQ: 'What particle carries a positive charge?',
  },
  {
    id: 'data_science',
    name: 'Data Science',
    icon: Database,
    sampleQ: 'What does SQL stand for?',
  },
];

export function PlayablePreview() {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 container mx-auto px-6 py-10 md:py-14">
      <div className="text-center mb-8">
        <p className="text-accent text-sm font-bold uppercase tracking-widest mb-2">🔥 Trending Challenges</p>
        <h2 className="text-3xl md:text-4xl font-bold">Choose Your Challenge</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
        {FEATURED_CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            className="glass-card rounded-xl p-5 flex flex-col justify-between hover:shadow-gold-glow transition-all duration-300 cursor-pointer group"
            onClick={() => navigate(`/quiz/category/${cat.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/quiz/category/${cat.id}`)}
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center mb-3">
                <cat.icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold text-base mb-1.5">{cat.name}</h3>
              <p className="text-xs text-muted-foreground italic mb-4 line-clamp-2">
                "{cat.sampleQ}"
              </p>
            </div>
            <CTAButton label="Play Now" size="sm" fullWidth />
          </div>
        ))}
      </div>
    </section>
  );
}
