import { StatsClient } from '@/components/pages/StatsClient'

export const metadata = {
  title: 'Player Stats — Life RPG',
  description: 'Your player stats — STR, AGI, VIT, INT.',
}

export default function StatsPage() {
  return (
    <div 
      className="-m-4 md:-m-8 min-h-[calc(100vh-4rem)] md:min-h-screen relative bg-cover bg-no-repeat bg-top"
      style={{
        backgroundImage: 'url(/player-stats-bg.jpg)',
      }}
    >
      {/* Subtle overlay so fantasy environment remains completely visible */}
      <div className="absolute inset-0 bg-black/15 pointer-events-none z-0" />

      <div className="relative z-10 w-full p-4 md:p-8 pt-10 md:pt-14 pb-20 md:pb-16 flex flex-col items-center">
        <StatsClient />
      </div>
    </div>
  )
}
