'use client'

import { useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { useQueryClient } from '@tanstack/react-query'
import { SHOP_ITEMS } from '@/lib/progression/engine'
import { toast } from '@/components/ui/Toaster'
import { motion } from 'framer-motion'
import Image from 'next/image'

export function ShopClient() {
  const { data, isLoading, error, refetch } = useProfile()
  const queryClient = useQueryClient()
  const [purchasing, setPurchasing] = useState<string | null>(null)

  if (error) {
    return (
      <div className="p-8 text-center bg-black/80 border border-amber-900/60" role="alert">
        <p className="text-amber-500 font-display text-sm tracking-wider">SYSTEM ANOMALY</p>
        <button onClick={() => refetch()} className="btn btn-ghost mt-4 text-xs text-amber-200 border border-amber-500/40">RETRY</button>
      </div>
    )
  }

  const purchasedItems = new Set(data?.purchasedItems ?? [])
  const profile = data?.profile

  async function handlePurchase(itemKey: string) {
    setPurchasing(itemKey)
    try {
      // Demo mode: purchase locally with localStorage (never hits Supabase)
      const { isDemoMode } = await import('@/lib/demo/demoMode')
      if (isDemoMode()) {
        const demo = await import('@/lib/demo/demoMode')
        const item = SHOP_ITEMS.find((i) => i.key === itemKey)
        if (!item) {
          toast('Item not found.', 'error')
          return
        }
        const owned = demo.getDemoPurchases()
        if (owned.includes(itemKey)) {
          toast('Item already owned.', 'error')
          return
        }
        const prof = demo.getDemoProfile()
        const balance = item.currencyType === 'gold' ? prof.gold : prof.mana_crystals
        if (balance < item.cost) {
          toast(`Insufficient ${item.currencyType === 'gold' ? 'gold' : 'mana'}.`, 'error')
          return
        }
        demo.saveDemoProfile({
          ...prof,
          gold: item.currencyType === 'gold' ? prof.gold - item.cost : prof.gold,
          mana_crystals:
            item.currencyType === 'mana_crystals' ? prof.mana_crystals - item.cost : prof.mana_crystals,
        })
        demo.saveDemoPurchases([...owned, itemKey])
        toast('Item acquired.', 'success')
        queryClient.invalidateQueries({ queryKey: ['profile'] })
        return
      }
      const res = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_key: itemKey }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg =
          typeof json?.error === 'string'
            ? json.error
            : (json?.error?.message ?? json?.errorMessage ?? 'Purchase failed.')
        toast(msg, 'error')
        return
      }
      toast('Item acquired.', 'success')
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['shop'] })
    } catch {
      toast('Connection lost. Purchase failed.', 'error')
    } finally {
      setPurchasing(null)
    }
  }

  const merchItems = SHOP_ITEMS.filter((i) => i.category === 'merch')

  return (
    <div className="space-y-6 w-full">
      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-start justify-between"
      >
        <div>
          <div className="font-display text-xs text-[#e5c282] tracking-[0.25em] font-semibold uppercase mb-1">
            EQUIPMENT &amp; MERCH VENDOR
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-normal text-[#fae5c3] tracking-wider drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]">
            SYSTEM SHOP
          </h1>
        </div>
        {profile && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex items-center pt-2"
          >
            <span className="font-display text-[#f59e0b] text-xl md:text-2xl font-bold tracking-wider drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">
              {profile.gold.toLocaleString()} G
            </span>
          </motion.div>
        )}
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5" aria-busy="true">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 bg-black/60 border border-amber-900/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <section aria-label="Official Merch" className="space-y-3">
          <h2 className="font-display text-xs text-[#e5c282] tracking-[0.2em] font-semibold uppercase">
            EQUIPMENT (PURCHASE WITH GOLD)
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5" role="list">
            {merchItems.map((item, idx) => {
              const owned = purchasedItems.has(item.key)
              const balance = profile?.gold ?? 0
              const canAfford = balance >= item.cost
              const isBuying = purchasing === item.key

              return (
                <motion.li
                  key={item.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`group relative p-3.5 flex flex-col justify-between transition-all bg-black/75 backdrop-blur-sm border ${
                    owned
                      ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'border-[#c69b3f]/60 hover:border-[#f59e0b] shadow-[0_4px_25px_rgba(0,0,0,0.85)]'
                  }`}
                >
                  {/* Ornate Gold Corner Accents */}
                  <span className="absolute -top-[1px] -left-[1px] w-2.5 h-2.5 border-t-2 border-l-2 border-[#f59e0b] pointer-events-none" />
                  <span className="absolute -top-[1px] -right-[1px] w-2.5 h-2.5 border-t-2 border-r-2 border-[#f59e0b] pointer-events-none" />
                  <span className="absolute -bottom-[1px] -left-[1px] w-2.5 h-2.5 border-b-2 border-l-2 border-[#f59e0b] pointer-events-none" />
                  <span className="absolute -bottom-[1px] -right-[1px] w-2.5 h-2.5 border-b-2 border-r-2 border-[#f59e0b] pointer-events-none" />

                  {/* Top: Product Image */}
                  <div className="relative w-full h-44 sm:h-48 md:h-52 bg-white rounded-sm overflow-hidden flex items-center justify-center">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      unoptimized
                      className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    />
                    {owned && (
                      <span className="absolute top-2 right-2 bg-black/90 border border-[#f59e0b] font-display text-[10px] text-amber-300 px-2 py-0.5 tracking-wider">
                        OWNED
                      </span>
                    )}
                  </div>

                  {/* Middle: Title and Description */}
                  <div className="mt-3.5 space-y-1 flex-1">
                    <h3 className="font-display text-sm font-semibold text-white tracking-wide">
                      {item.name}
                    </h3>
                    <p className="text-zinc-400 text-xs font-body leading-relaxed min-h-[2.25rem]">
                      {item.description}
                    </p>
                  </div>

                  {/* Bottom: Price and Action */}
                  <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <div className="flex flex-col leading-tight">
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-sm font-bold text-yellow-400">
                          {item.cost.toLocaleString()}
                        </span>
                        {canAfford && (
                          <span className="font-display text-xs font-semibold text-yellow-400">
                            Gold
                          </span>
                        )}
                      </div>
                      {!canAfford && (
                        <span className="font-display text-xs font-semibold text-yellow-400">
                          Gold
                        </span>
                      )}
                    </div>

                    {owned ? (
                      <span className="font-display text-[11px] text-zinc-400 tracking-wider">
                        Acquired
                      </span>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePurchase(item.key)}
                        disabled={!canAfford || isBuying || purchasing !== null}
                        aria-busy={isBuying}
                        aria-label={`Purchase ${item.name} for ${item.cost} Gold`}
                        className={
                          canAfford
                            ? 'border border-[#d4af37] bg-black/70 hover:bg-[#d4af37]/20 text-[#fef3c7] font-display text-xs font-bold tracking-widest px-4 py-1.5 transition-all shadow-[0_0_10px_rgba(212,175,55,0.3)] hover:shadow-[0_0_16px_rgba(212,175,55,0.5)]'
                            : 'border border-slate-800/80 bg-black/60 text-[#3b597d] font-display text-[10px] font-bold tracking-wider px-3 py-1.5 cursor-not-allowed flex flex-col items-center justify-center leading-tight'
                        }
                      >
                        {isBuying ? (
                          'BUYING...'
                        ) : canAfford ? (
                          'BUY'
                        ) : (
                          <>
                            <span>NEED</span>
                            <span>GOLD</span>
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </motion.li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
