import { cn } from '@/lib/utils';

interface StrokeEchoProps {
  /** array of lines; each may include lime-block fragment */
  lines: ReadonlyArray<{
    text: React.ReactNode;
    treatment: 'solid' | 'stroke' | 'block';
  }>;
  /** echo offset px for ghost layer; 0 disables */
  echoOffset?: number;
  className?: string;
}

const TREATMENT: Record<StrokeEchoProps['lines'][number]['treatment'], string> = {
  solid: 'text-ink',
  stroke: 'stroke-cyan',
  block: '',
};

export function StrokeEcho({ lines, echoOffset = 6, className }: StrokeEchoProps) {
  return (
    <div className={cn('relative display-ko text-[clamp(40px,7vw,80px)]', className)}>
      {echoOffset > 0 ? (
        <div
          aria-hidden
          className="pointer-events-none absolute select-none"
          style={{ transform: `translate(${echoOffset}px, ${echoOffset}px)`, top: 0, left: 0 }}
        >
          {lines.map((l, i) => (
            <div key={i} className="stroke-ink opacity-40">
              {l.text}
            </div>
          ))}
        </div>
      ) : null}
      <div className="relative">
        {lines.map((l, i) => (
          <div
            key={i}
            className={cn(l.treatment === 'block' ? '' : TREATMENT[l.treatment])}
          >
            {l.treatment === 'block' ? l.text : l.text}
          </div>
        ))}
      </div>
    </div>
  );
}
