import { ArmyClient } from '@/components/pages/ArmyClient'

export const metadata = {
  title: 'Player Collection — Life RPG',
  description: 'Your collected items. Unlocked through real-world achievements.',
}

export default function ArmyPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <ArmyClient />
    </div>
  )
}
