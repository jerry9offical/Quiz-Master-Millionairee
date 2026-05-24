import { ListChecks, Timer, TrendingUp } from 'lucide-react';

const STEPS = [
  {
    icon: ListChecks,
    title: 'Pick a Category',
    desc: 'Choose from 13+ subjects — science, sports, general knowledge, and more.',
  },
  {
    icon: Timer,
    title: 'Answer 15 Timed Questions',
    desc: '30 seconds per question. Use lifelines wisely to keep climbing.',
  },
  {
    icon: TrendingUp,
    title: 'Climb the Leaderboard',
    desc: 'Earn milestone points and compete for global rankings.',
  },
];

export function HowItWorks() {
  return (
    <section className="relative z-10 container mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">How It Works</h2>
        <p className="text-muted-foreground">Three simple steps to prove your knowledge.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {STEPS.map((step, i) => (
          <div key={i} className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent/15 border-2 border-accent/30 flex items-center justify-center mx-auto">
              <step.icon className="w-7 h-7 text-accent" />
            </div>
            <div className="text-2xl font-black gradient-text-gold">{i + 1}</div>
            <h3 className="font-semibold text-lg">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground/60 mt-8 italic">
        No gambling. No cash betting. Just skill, speed, and knowledge.
      </p>
    </section>
  );
}
