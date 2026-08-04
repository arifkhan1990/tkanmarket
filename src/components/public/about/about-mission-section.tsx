export function AboutMissionSection() {
  return (
    <section id="our-mission" className="bg-surface-container-low py-24">
      <div className="flex flex-col gap-16 md:flex-row md:items-start">
        <div className="md:w-1/3">
          <h2 className="mb-4 text-4xl font-extrabold tracking-tight font-heading text-on-surface">Our Mission</h2>
          <div className="h-1.5 w-24 rounded-full bg-primary" />
        </div>

        <div className="space-y-8 md:w-2/3">
          <p className="text-3xl font-heading font-semibold leading-snug text-on-surface">
            To eliminate the friction in textile procurement through transparency, digital curation, and
            architectural precision.
          </p>
          <p className="text-lg leading-relaxed text-on-surface-variant">
            For decades, the textile industry has operated in silos. TkanMarket was built to bridge these gaps
            using modern technology. We treat every fabric as a piece of data and every supplier as a partner in a
            global network. Our focus is not just on volume, but on the quality of connection.
          </p>
        </div>
      </div>
    </section>
  )
}

