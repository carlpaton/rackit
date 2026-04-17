export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="animate-bounce">
        <svg
          viewBox="0 0 100 100"
          className="size-20 drop-shadow-xl"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="shine" cx="38%" cy="28%" r="55%">
              <stop offset="0%" stopColor="white" stopOpacity="0.2" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="47" fill="#111111" />
          <circle cx="50" cy="50" r="47" fill="url(#shine)" />
          <circle cx="50" cy="50" r="20" fill="white" />
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="22"
            fontWeight="bold"
            fill="#111111"
            fontFamily="sans-serif"
          >
            8
          </text>
        </svg>
      </div>
      <p className="text-muted-foreground text-sm tracking-wide animate-pulse">
        Racking up…
      </p>
    </div>
  );
}
