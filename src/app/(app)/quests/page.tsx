import { QuestLogClient } from '@/components/pages/QuestLogClient'

export const metadata = {
  title: 'Quest Log — Life RPG',
  description: 'Manage your active quests, daily quests, and gates.',
}

export default function QuestsPage() {
  return (
    <div 
      className="-m-4 md:-m-8 min-h-[calc(100vh-4rem)] md:min-h-screen relative bg-cover bg-no-repeat bg-top"
      style={{
        backgroundImage: 'url(/quest-log-bg.jpg)',
      }}
    >
      {/* Subtle dark vignette overlay */}
      <div className="absolute inset-0 bg-black/35 pointer-events-none z-0" />

      <div className="relative z-10 p-4 md:p-8 pt-24 md:pt-36 pb-24 md:pb-12">
        <QuestLogClient />
      </div>
    </div>
  )
}
