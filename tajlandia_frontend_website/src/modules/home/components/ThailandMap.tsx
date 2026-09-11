import type { HomePageContent } from "../types/home.types";

type ThailandMapProps = {
  pins: HomePageContent["map"]["pins"];
};

export function ThailandMap({ pins }: ThailandMapProps) {
  return (
    <svg
      viewBox="0 0 420 760"
      role="img"
      aria-label="Map of Thailand with destination markers"
      className="mx-auto h-auto w-full max-w-lg"
    >
      <rect width="420" height="760" rx="32" fill="#D7EAF4" />
      <path
        d="M210 28C246 36 268 70 274 112C280 154 262 176 278 214C292 248 328 262 338 304C348 348 322 372 328 416C334 456 368 470 364 516C360 560 318 574 300 616C284 652 292 690 268 718C244 746 200 742 176 710C152 678 164 636 150 598C136 560 96 548 92 504C88 458 126 442 122 396C118 352 78 338 84 292C90 246 130 238 138 196C146 154 124 118 146 82C168 46 184 22 210 28Z"
        fill="#7FB77E"
        stroke="#4F8A5B"
        strokeWidth="3"
      />
      <path
        d="M188 430C210 438 236 452 248 486C260 520 246 552 238 586"
        fill="none"
        stroke="#5E9A6A"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M92 504C110 490 138 498 150 520C162 542 148 566 132 578"
        fill="#9ED0A3"
        opacity="0.7"
      />
      {pins.map((pin) => (
        <g key={pin.id}>
          <circle cx={pin.x} cy={pin.y} r="16" fill="#C81E1E" opacity="0.18" />
          <circle cx={pin.x} cy={pin.y} r="8" fill="#C81E1E" />
          <circle cx={pin.x} cy={pin.y} r="3" fill="#FFFFFF" />
          <text
            x={pin.x + 18}
            y={pin.y + 4}
            fill="#0B1F4D"
            fontSize="14"
            fontFamily="inherit"
          >
            {pin.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
