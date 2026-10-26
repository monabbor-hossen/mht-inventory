'use client'

// ====================================================================
// Presentation Layer: Product Master Catalog View
// ====================================================================

import { useState, useEffect } from 'react'
import { Button, Card, Field, Icon, inputCls } from '@/components/ui'
import { createProductAction } from '@/presentation/actions/wmsActions'

interface Product {
  id: number
  sku: string
  name: string
  category: string
  unit_weight: number
  unit_of_measure: string
  min_stock_alert: number
  is_active: boolean
}

export function ProductMasterView({
  onToast,
}: {
  onToast: (msg: string, tone: 'success' | 'error' | 'warning') => void
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')

  // Form states
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Rice & Grain')
  const [weight, setWeight] = useState(25)
  const [minAlert, setMinAlert] = useState(10)
  const [description, setDescription] = useState('')

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/products?query=${encodeURIComponent(search)}`)
      const json = await res.json()
      if (json.success) {
        setProducts(json.data)
      }
    } catch {
      onToast('Failed to load products catalog', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [search])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('sku', sku)
    formData.append('name', name)
    formData.append('category', category)
    formData.append('unit_weight', String(weight))
    formData.append('unit_of_measure', 'kg')
    formData.append('min_stock_alert', String(minAlert))
    formData.append('description', description)

    const result = await createProductAction(formData)
    if (result.success) {
      onToast(result.message || 'Product created', 'success')
      setShowModal(false)
      setSku('')
      setName('')
      setDescription('')
      fetchProducts()
    } else {
      onToast(result.error || 'Failed to create product', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Product Master Catalog</h2>
          <p className="text-xs text-muted">Register SKUs, product categories, and unit weight thresholds.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search SKU or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} w-56 text-xs`}
          />
          <Button variant="filled" onClick={() => setShowModal(true)} className="flex items-center gap-1.5 text-xs">
            <Icon name="plus" className="size-4" />
            <span>Add New SKU</span>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border border-line bg-surface p-0 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-bg text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">Product Name</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Unit Weight</th>
                <th className="px-4 py-3 font-semibold">Min Stock Alert</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    {loading ? 'Loading catalog...' : 'No products found. Click "Add New SKU" to register one.'}
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-primary-soft/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-primary">{p.sku}</td>
                    <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                    <td className="px-4 py-3 text-muted">{p.category}</td>
                    <td className="px-4 py-3 text-ink">
                      {p.unit_weight} {p.unit_of_measure}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">
                        {p.min_stock_alert} units
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          p.is_active ? 'bg-success-soft text-success' : 'bg-error-soft text-error'
                        }`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {p.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Register Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <h3 className="text-base font-bold text-ink">Register Master SKU</h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-ink cursor-pointer">
                <Icon name="x" className="size-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <Field label="SKU Code (e.g. MINIKET-25KG)">
                <input
                  required
                  placeholder="MINIKET-25KG"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className={inputCls()}
                />
              </Field>
              <Field label="Product Name">
                <input
                  required
                  placeholder="Miniket Premium Rice 25kg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls()}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls()}>
                    <option value="Rice & Grain">Rice & Grain</option>
                    <option value="Wheat & Flour">Wheat & Flour</option>
                    <option value="Pulses & Lentils">Pulses & Lentils</option>
                    <option value="Spices & Seeds">Spices & Seeds</option>
                    <option value="Packaging Materials">Packaging</option>
                  </select>
                </Field>
                <Field label="Unit Weight (kg)">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className={inputCls()}
                  />
                </Field>
              </div>
              <Field label="Min Stock Alert Threshold">
                <input
                  type="number"
                  min="1"
                  value={minAlert}
                  onChange={(e) => setMinAlert(Number(e.target.value))}
                  className={inputCls()}
                />
              </Field>
              <Field label="Description (Optional)">
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputCls()}
                  placeholder="Product specifications..."
                />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outlined" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="filled">
                  Register SKU
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
