import Image from 'next/image'
import { ShieldCheck } from 'lucide-react'

export function AboutMarketplaceScaleSection() {
  return (
    <section className="py-32">
      <div className="mb-16">
        <h2 className="mb-4 text-4xl font-extrabold tracking-tight font-heading text-on-surface">
          The Marketplace Scale
        </h2>
        <p className="text-on-surface-variant">Data-driven excellence across the global supply chain.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="flex min-h-[300px] flex-col justify-between rounded-2xl border border-outline/10 bg-surface-container-lowest p-12 md:col-span-2 shadow-sm">
          <span className="text-primary text-xs font-mono font-bold uppercase tracking-widest">Inventory</span>
          <div className="mt-8">
            <h3 className="mb-2 text-7xl font-extrabold tracking-tighter font-heading text-on-surface">10,000+</h3>
            <p className="text-xl text-on-surface-variant">Verified unique fabrics indexed in our digital library.</p>
          </div>
        </div>

        <div className="flex min-h-[300px] flex-col justify-between rounded-2xl bg-primary p-12 text-on-primary shadow-sm">
          <span className="font-mono text-xs font-bold uppercase tracking-widest opacity-80">Suppliers</span>
          <div className="mt-8">
            <h3 className="mb-2 text-5xl font-extrabold tracking-tighter font-heading">450+</h3>
            <p className="text-on-primary text-opacity-90">Tier-1 global manufacturers.</p>
          </div>
        </div>

        <div className="flex min-h-[300px] flex-col justify-between rounded-2xl bg-surface-container-highest p-12 shadow-sm">
          <span className="text-primary font-mono text-xs font-bold uppercase tracking-widest">Global reach</span>
          <div className="mt-8">
            <h3 className="mb-2 text-5xl font-extrabold tracking-tighter font-heading text-on-surface">18</h3>
            <p className="text-on-surface-variant">Shipping hubs strategically located worldwide.</p>
          </div>
        </div>

        <div className="relative h-[400px] overflow-hidden rounded-2xl md:col-span-3 group">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgDp6WKP9tAux4LqwFeiUrwCmHTvSnglMKPjvihliUxg8ltwatz1QgmViMkbygmxKpTZOViMe8esmnRB6iIYj5zDas0ofjzo39th3Y_4GpfwFtN0GTP-4aZjjLteh3O47g8_RAaL_Z1DpP2vuj4TOqrVZb2bi9vxqvJgIJRPAoPYpTRn7rtRPihAB4A0GbqjeKRwb-t7bfPbrPJYBC8NpI0dEnkOQQc7qn5fO1sNZvutlb_P756JukzVq3Y4qPQo_C3tp2cFOISpc"
            alt="Logistics Center"
            fill
            sizes="(max-width: 768px) 100vw, 75vw"
            priority
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex flex-end bg-gradient-to-t from-on-surface/60 to-transparent p-12">
            <h4 className="self-end text-3xl font-bold font-heading text-white">Integrated Smart Logistics</h4>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-container-lowest p-12 text-center shadow-sm border border-outline/10">
          <ShieldCheck className="mb-4 h-16 w-16 text-primary" aria-hidden />
          <h4 className="text-2xl font-bold font-heading">
            <span className="text-on-surface">99.9%</span>
          </h4>
          <p className="text-sm text-on-surface-variant">Quality Control Pass Rate</p>
        </div>
      </div>
    </section>
  )
}

