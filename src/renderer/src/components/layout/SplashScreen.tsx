export default function SplashScreen(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full"
      style={{ backgroundColor: 'var(--c-base)' }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="text-5xl animate-bounce">📋</div>
        <div className="text-xl font-semibold tracking-wide" style={{ color: 'var(--c-text-secondary)' }}>
          Planner
        </div>
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
