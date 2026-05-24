import { Star, Users, Globe } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const STATS = [
  { icon: Star, label: 'Player Rating', target: 4.8, suffix: '/5', prefix: '' },
  { icon: Users, label: 'Players This Week', target: 1000, suffix: '+', prefix: '' },
  { icon: Globe, label: 'Countries', target: 10, suffix: '+', prefix: '' },
];

function AnimatedCounter({ target, suffix, prefix }: { target: number; suffix: string; prefix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const isDecimal = target % 1 !== 0;
          const steps = 40;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            setCount(isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current));
          }, 30);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="text-2xl md:text-3xl font-black text-accent tabular-nums">
      {prefix}{target % 1 !== 0 ? count.toFixed(1) : count.toLocaleString()}{suffix}
    </span>
  );
}

export function SocialProofStrip() {
  return (
    <section className="relative z-10 py-10 border-y border-accent/10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
          {STATS.map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-1 text-center">
              <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center mb-1">
                <stat.icon className="w-5 h-5 text-accent" />
              </div>
              <AnimatedCounter target={stat.target} suffix={stat.suffix} prefix={stat.prefix} />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
