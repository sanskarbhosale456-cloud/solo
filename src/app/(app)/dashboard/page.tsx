import { Suspense } from 'react'
import { StatusWindowClient } from '@/components/pages/StatusWindowClient'
import { ParticleFieldLazy } from '@/components/three'

export const metadata = {
  title: 'Status Window — Life RPG',
  description: 'Your hunter status window. Track XP, rank, stats, and daily quests.',
}

export default function DashboardPage() {
  return (
    <div className="-m-4 md:-m-8 min-h-[calc(100vh-4rem)] md:min-h-screen relative p-4 md:p-8 lg:p-12 pb-24 md:pb-12 bg-[#04020a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#170a2e]/60 via-[#0a0518]/80 to-[#04020a] overflow-hidden">
      {/* Ambient purple & cyan particle field */}
      <ParticleFieldLazy count={220} color="#a855f7" className="opacity-40" />
      {/* Subtle purple cosmic nebula glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-950/20 rounded-full blur-3xl pointer-events-none z-0" />
      
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
