import { StatsClient } from '@/components/pages/StatsClient'
import { FloatingGateOrbLazy } from '@/components/three'

export const metadata = {
  title: 'Stat Allocation — Life RPG',
  description: 'Your hunter attributes — STR, AGI, VIT, INT, PER.',
}

export default function StatsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 relative">
      {/* Floating orb — decorative, right-aligned on desktop */}
      <FloatingGateOrbLazy className="hidden lg:block absolute top-4 right-8 w-48 h-48 opacity-60" />
      <StatsClient />
    </div>
  )
}
