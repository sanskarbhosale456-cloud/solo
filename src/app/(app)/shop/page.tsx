import { ShopClient } from '@/components/pages/ShopClient'

export const metadata = {
  title: 'Shop — Life RPG',
  description: 'Spend Gold and Mana Crystals on cosmetic upgrades for your hunter.',
}

export default function ShopPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <ShopClient />
    </div>
  )
}
