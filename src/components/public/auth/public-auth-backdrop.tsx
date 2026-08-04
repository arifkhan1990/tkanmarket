/**
 * Decorative blur blobs (Stitch / admin-login style). Safe for server or client.
 */
export function PublicAuthBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/5 blur-[100px]" />
      <div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-secondary-container/10 blur-[120px]" />
      <div className="absolute -bottom-16 left-1/4 h-56 w-56 rounded-full bg-tertiary-fixed/20 blur-[80px]" />
    </div>
  )
}
