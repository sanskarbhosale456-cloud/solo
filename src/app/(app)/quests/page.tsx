import { QuestLogClient } from '@/components/pages/QuestLogClient'

export const metadata = {
  title: 'Quest Log — Life RPG',
  description: 'Manage your active quests, daily quests, and gates.',
}

export default function QuestsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <QuestLogClient />
    </div>
  )
}
