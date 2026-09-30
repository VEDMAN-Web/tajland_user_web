function UnionJack() {
  return (
    <g>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0 0 L60 30 M60 0 L0 30" stroke="#fff" strokeWidth="6" />
      <path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0 V30 M0 15 H60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0 V30 M0 15 H60" stroke="#C8102E" strokeWidth="6" />
    </g>
  );
}

export function CountryFlag({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 60 30" aria-hidden="true" className="h-4 w-6 shrink-0 overflow-hidden rounded-[2px] shadow-[inset_0_0_0_1px_rgba(11,31,77,0.16)]">
      {id === "PL" ? (
        <>
          <rect width="60" height="15" fill="#fff" />
          <rect y="15" width="60" height="15" fill="#DC143C" />
        </>
      ) : null}
      {id === "FR" ? (
        <>
          <rect width="20" height="30" fill="#002395" />
          <rect x="20" width="20" height="30" fill="#fff" />
          <rect x="40" width="20" height="30" fill="#ED2939" />
        </>
      ) : null}
      {id === "DE" ? (
        <>
          <rect width="60" height="10" fill="#000" />
          <rect y="10" width="60" height="10" fill="#DD0000" />
          <rect y="20" width="60" height="10" fill="#FFCE00" />
        </>
      ) : null}
      {id === "IN" ? (
        <>
          <rect width="60" height="10" fill="#FF9933" />
          <rect y="10" width="60" height="10" fill="#fff" />
          <rect y="20" width="60" height="10" fill="#138808" />
          <circle cx="30" cy="15" r="3.2" fill="none" stroke="#000080" strokeWidth="0.8" />
        </>
      ) : null}
      {id === "TH" ? (
        <>
          <rect width="60" height="5" fill="#A51931" />
          <rect y="5" width="60" height="5" fill="#fff" />
          <rect y="10" width="60" height="10" fill="#2D2A4A" />
          <rect y="20" width="60" height="5" fill="#fff" />
          <rect y="25" width="60" height="5" fill="#A51931" />
        </>
      ) : null}
      {id === "SG" ? (
        <>
          <rect width="60" height="15" fill="#EF3340" />
          <rect y="15" width="60" height="15" fill="#fff" />
          <circle cx="13" cy="7.5" r="4.4" fill="#fff" />
          <circle cx="15" cy="7.5" r="3.4" fill="#EF3340" />
          <circle cx="22" cy="4" r="0.7" fill="#fff" />
          <circle cx="24.5" cy="6" r="0.7" fill="#fff" />
          <circle cx="24.5" cy="9" r="0.7" fill="#fff" />
          <circle cx="22" cy="11" r="0.7" fill="#fff" />
          <circle cx="20" cy="7.5" r="0.7" fill="#fff" />
        </>
      ) : null}
      {id === "AE" ? (
        <>
          <rect width="15" height="30" fill="#FF0000" />
          <rect x="15" width="45" height="10" fill="#00732F" />
          <rect x="15" y="10" width="45" height="10" fill="#fff" />
          <rect x="15" y="20" width="45" height="10" fill="#000" />
        </>
      ) : null}
      {id === "GB" ? <UnionJack /> : null}
      {id === "US" ? (
        <>
          {Array.from({ length: 13 }, (_, index) => (
            <rect key={index} y={(30 / 13) * index} width="60" height={30 / 13 + 0.2} fill={index % 2 === 0 ? "#B22234" : "#fff"} />
          ))}
          <rect width="26" height="16" fill="#3C3B6E" />
        </>
      ) : null}
      {id === "AU" ? (
        <>
          <rect width="60" height="30" fill="#012169" />
          <g transform="scale(0.5)">
            <UnionJack />
          </g>
          <circle cx="15" cy="22" r="1.7" fill="#fff" />
          <circle cx="45" cy="7" r="1.2" fill="#fff" />
          <circle cx="51" cy="14" r="1.3" fill="#fff" />
          <circle cx="47" cy="22" r="1.15" fill="#fff" />
          <circle cx="40" cy="18" r="1" fill="#fff" />
        </>
      ) : null}
    </svg>
  );
}
