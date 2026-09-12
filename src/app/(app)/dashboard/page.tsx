import { Suspense } from 'react'
import { StatusWindowClient } from '@/components/pages/StatusWindowClient'
import { ParticleFieldLazy } from '@/components/three'

export const metadata = {
  title: 'Status Window — Life RPG',
  description: 'Your hunter status window. Track XP, rank, stats, and daily quests.',
}

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 relative">
      <ParticleFieldLazy count={200} color="#3B82F6" className="opacity-30" />
      <div className="relative z-10">
        <Suspense fallback={<StatusWindowSkeleton />}>
          <StatusWindowClient />
        </Suspense>
      </div>
    </div>
  )
}

function StatusWindowSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-label="Loading status window" aria-busy="true">
      <div className="panel p-6 h-40 skeleton" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="panel p-4 h-20 skeleton" />
        ))}
      </div>
      <div className="panel p-6 h-48 skeleton" />
    </div>
  )
}
