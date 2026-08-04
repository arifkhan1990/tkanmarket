export function AboutProcessSection() {
  return (
    <section className="bg-surface-container-low py-24">
      <div className="mb-20 text-center">
        <h2 className="mb-6 text-4xl font-extrabold tracking-tight font-heading text-on-surface">
          Precision From Discovery to Delivery
        </h2>
        <p className="text-lg text-on-surface-variant">Our architectural approach to procurement ensures reliability at every milestone.</p>
      </div>

      <div className="relative grid gap-12 md:grid-cols-3">
        <div className="z-10 rounded-2xl bg-surface-container-lowest p-10 shadow-sm">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container font-mono text-xl font-bold text-on-primary">
            01
          </div>
          <h3 className="mb-4 text-2xl font-bold font-heading text-on-surface">Intelligent Discovery</h3>
          <p className="leading-relaxed text-on-surface-variant">
            Use our advanced crawler and filters to find the exact GSM, weave, and composition required for your project.
          </p>
        </div>

        <div className="z-10 rounded-2xl bg-surface-container-lowest p-10 shadow-sm">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container font-mono text-xl font-bold text-on-primary">
            02
          </div>
          <h3 className="mb-4 text-2xl font-bold font-heading text-on-surface">Verified Sampling</h3>
          <p className="leading-relaxed text-on-surface-variant">
            Sample books are dispatched from our regional hubs within 24 hours, ensuring you touch and feel the quality before bulk orders.
          </p>
        </div>

        <div className="z-10 rounded-2xl bg-surface-container-lowest p-10 shadow-sm">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container font-mono text-xl font-bold text-on-primary">
            03
          </div>
          <h3 className="mb-4 text-2xl font-bold font-heading text-on-surface">Direct Fulfillment</h3>
          <p className="leading-relaxed text-on-surface-variant">
            Automated tracking and direct-from-factory shipping minimizes overhead and maximizes speed to your production floor.
          </p>
        </div>
      </div>
    </section>
  )
}

