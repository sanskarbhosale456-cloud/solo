'use client'

import { useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { useQueryClient } from '@tanstack/react-query'
import { SHOP_ITEMS } from '@/lib/progression/engine'
import { toast } from '@/components/ui/Toaster'

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

  const categories = [
    { id: 'frame', label: 'Profile Frames' },
    { id: 'soldier_skin', label: 'Soldier Skins' },
    { id: 'theme', label: 'UI Themes' },
  ]

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display text-xs text-glow-sky/60 tracking-[0.3em] uppercase mb-1">VENDOR</div>
          <h1 className="font-display text-2xl text-white tracking-wider">SHOP</h1>
        </div>
        {profile && (
          <div className="flex gap-4 text-sm">
            <span className="font-display text-gold">{profile.gold.toLocaleString()} G</span>
            <span className="font-display text-glow-violet">{profile.mana_crystals.toLocaleString()} MC</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" aria-busy="true">
          {[...Array(6)].map((_, i) => <div key={i} className="panel h-44 skeleton" />)}
        </div>
      ) : (
        categories.map((cat) => {
          const items = SHOP_ITEMS.filter((i) => i.category === cat.id)
          return (
            <section key={cat.id} aria-label={cat.label}>
              <h2 className="font-display text-xs text-glow-sky tracking-[0.2em] uppercase mb-3 flex items-center gap-3">
                {cat.label}
                <span className="h-px flex-1 bg-glow/10" aria-hidden="true" />
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" role="list">
                {items.map((item) => {
                  const owned = purchasedItems.has(item.key)
                  const isCurrencyGold = item.currencyType === 'gold'
                  const balance = isCurrencyGold ? (profile?.gold ?? 0) : (profile?.mana_crystals ?? 0)
                  const canAfford = balance >= item.cost
                  const isBuying = purchasing === item.key

                  return (
                    <li
                      key={item.key}
                      className={`panel p-5 flex flex-col gap-3 transition-all ${
                        owned ? 'border-glow/40' : 'panel-hover'
                      }`}
                    >
                      {/* Category icon */}
                      <div className="flex items-center justify-between">
                        <span className="font-display text-xs text-white/30 tracking-wider uppercase">
                          {cat.label.replace(/s$/, '')}
                        </span>
                        {owned && (
                          <span className="font-display text-xs text-glow-sky tracking-wider">OWNED</span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-display text-sm text-white tracking-wide">{item.name}</h3>
                        <p className="font-body text-xs text-white/40 mt-1 leading-snug">{item.description}</p>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-2 border-t border-glow/10">
                        <span
                          className="font-display text-sm font-bold"
                          style={{ color: isCurrencyGold ? '#FBBF24' : '#8B5CF6' }}
                        >
                          {item.cost.toLocaleString()} {isCurrencyGold ? 'Gold' : 'MC'}
                        </span>
                        {owned ? (
                          <span className="font-body text-xs text-white/30">Acquired</span>
                        ) : (
                          <button
                            onClick={() => handlePurchase(item.key)}
                            disabled={!canAfford || isBuying || purchasing !== null}
                            aria-busy={isBuying}
                            aria-label={`Purchase ${item.name} for ${item.cost} ${isCurrencyGold ? 'Gold' : 'Mana Crystals'}`}
                            className={`btn text-xs px-3 py-1.5 ${
                              canAfford ? 'btn-primary' : 'btn-ghost opacity-50 cursor-not-allowed'
                            }`}
                          >
                            {isBuying ? 'ACQUIRING...' : canAfford ? 'ACQUIRE' : 'INSUFFICIENT'}
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })
      )}
    </div>
  )
}
