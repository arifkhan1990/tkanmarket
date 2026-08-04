export default function DataMigrationMappingLoading() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <div className="h-10 w-80 animate-pulse rounded-lg bg-surface-container-highest" />
      <div className="h-4 max-w-2xl animate-pulse rounded bg-surface-container-highest" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="h-64 animate-pulse rounded-xl bg-surface-container-highest lg:col-span-3" />
        <div className="h-96 animate-pulse rounded-xl bg-surface-container-highest lg:col-span-6" />
        <div className="h-80 animate-pulse rounded-xl bg-surface-container-highest lg:col-span-3" />
      </div>
    </div>
  )
}
