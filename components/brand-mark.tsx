export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1" y="1" width="30" height="30" rx="9" fill="#080809" stroke="#ffffff" strokeOpacity=".16" />
      <text
        x="15.5"
        y="21.5"
        fill="#ffffff"
        fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="17"
        fontWeight="900"
        textAnchor="middle"
      >
        구
      </text>
      <circle cx="24.5" cy="9.5" r="2.5" fill="#dfff78" />
    </svg>
  );
}
