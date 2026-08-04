import { CrawlerSubNav } from '@/components/admin/crawler/CrawlerSubNav'

export default function CrawlerSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <CrawlerSubNav />
      {children}
    </div>
  )
}
