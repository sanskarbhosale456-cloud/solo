import { StatsClient } from '@/components/pages/StatsClient'

export const metadata = {
  title: 'Player Stats — Life RPG',
  description: 'Your player stats — STR, AGI, VIT, INT.',
}

export default function StatsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8 relative">
      <StatsClient />
    </div>
  )
}
