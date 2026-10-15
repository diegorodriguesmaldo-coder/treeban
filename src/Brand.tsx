export default function Brand({
  small = false,
  inverse = false,
  className = "",
}: {
  small?: boolean;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`brisa-brand ${small ? "brisa-brand-small" : ""} ${className}`}
    >
      <img
        src={
          small
            ? "/brand/brisa-symbol.svg"
            : inverse
              ? "/brand/brisa-logo-white.svg"
              : "/brand/brisa-logo.svg"
        }
        alt="brisa"
        width={small ? 36 : 128}
        height={small ? 36 : 56}
      />
    </span>
  );
}
