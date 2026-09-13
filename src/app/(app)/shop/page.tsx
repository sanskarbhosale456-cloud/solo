import { ShopClient } from '@/components/pages/ShopClient'

export const metadata = {
  title: 'Shop — Life RPG',
  description: 'Spend Gold and Mana Crystals on cosmetic upgrades for your hunter.',
}

export default function ShopPage() {
  return (
    <div 
      className="-m-4 md:-m-8 min-h-[calc(100vh-4rem)] md:min-h-screen relative bg-cover bg-no-repeat bg-top"
      style={{
        backgroundImage: 'url(/system-shop-bg.jpg)',
      }}
    >
      {/* Subtle overlay so fantasy artwork remains completely rich and atmospheric */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-[1060px] mx-auto p-4 md:p-8 pt-8 md:pt-12 pb-24 md:pb-20">
        <ShopClient />
      </div>
    </div>
  )
}
