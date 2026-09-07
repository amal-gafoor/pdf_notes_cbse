export default function Logo({ className = "h-9" }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src="/logo.svg" alt="Eduport" className={className} />
  );
}