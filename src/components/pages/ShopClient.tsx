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
      <div className="panel p-8 text-center" role="alert">
        <p className="text-danger font-display text-sm tracking-wider">SYSTEM ANOMALY</p>
        <button onClick={() => refetch()} className="btn btn-ghost mt-4 text-xs">RETRY</button>
      </div>
    )
  }

  const purchasedItems = new Set(data?.purchasedItems ?? [])
  const profile = data?.profile

  async function handlePurchase(itemKey: string) {
    setPurchasing(itemKey)
    try {
      const res = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_key: itemKey }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error ?? 'Purchase failed.', 'error')
        return
      }
      toast('Item acquired.', 'success')
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    } catch {
      toast('Connection lost. Purchase failed.', 'error')
    } finally {
      setPurchasing(null)
    }
  }

  const merchItems = SHOP_ITEMS.filter((i) => i.category === 'merch')

  return (
    <div className="space-y-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-start justify-between"
      >
        <div>
          <div className="font-display text-xs text-glow-sky/60 tracking-[0.3em] uppercase mb-1">EQUIPMENT & MERCH VENDOR</div>
          <h1 className="font-display text-2xl text-white tracking-wider">SYSTEM SHOP</h1>
        </div>
        {profile && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex gap-4 text-sm"
          >
            <span className="font-display text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">
              {profile.gold.toLocaleString()} G
            </span>
          </motion.div>
        )}
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" aria-busy="true">
          {[...Array(4)].map((_, i) => <div key={i} className="panel h-64 skeleton" />)}
        </div>
      ) : (
        <section aria-label="Official Merch">
          <h2 className="font-display text-xs text-glow-sky tracking-[0.2em] uppercase mb-4 flex items-center gap-3">
            EQUIPMENT (PURCHASE WITH GOLD)
            <span className="h-px flex-1 bg-glow/10" aria-hidden="true" />
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" role="list">
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
                  whileHover={{ y: -6, scale: 1.025, transition: { duration: 0.2 } }}
                  className={`panel p-4 flex flex-col gap-3 transition-colors ${
                    owned ? 'border-glow/40 bg-glow/5' : 'hover:border-glow/40'
                  }`}
                >
                  {/* Image */}
                  <div className="relative w-full h-44 bg-void-surface rounded-md overflow-hidden flex items-center justify-center">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {owned && (
                      <span className="absolute top-2 right-2 bg-void-bg/90 border border-glow/40 font-display text-[10px] text-glow-sky px-2 py-0.5 rounded tracking-wider">
                        OWNED
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-display text-sm text-white tracking-wide">{item.name}</h3>
                    <p className="font-body text-xs text-white/40 mt-1 leading-snug">{item.description}</p>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-glow/10">
                    <span className="font-display text-sm font-bold text-yellow-400">
                      {item.cost.toLocaleString()} Gold
                    </span>
                    {owned ? (
                      <span className="font-body text-xs text-white/30">Acquired</span>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePurchase(item.key)}
                        disabled={!canAfford || isBuying || purchasing !== null}
                        aria-busy={isBuying}
                        aria-label={`Purchase ${item.name} for ${item.cost} Gold`}
                        className={`btn text-xs px-3 py-1.5 ${
                          canAfford ? 'btn-primary shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'btn-ghost opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {isBuying ? 'BUYING...' : canAfford ? 'BUY' : 'NEED GOLD'}
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
