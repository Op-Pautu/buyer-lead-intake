'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createBuyerSchema } from '@/lib/validations'
import type { CreateBuyerData } from '@/lib/validations'

const cities = ['Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other']
const propertyTypes = ['Apartment', 'Villa', 'Plot', 'Office', 'Retail']
const bhkOptions = ['1', '2', '3', '4', 'Studio']
const purposes = ['Buy', 'Rent']
const timelines = ['0-3m', '3-6m', '>6m', 'Exploring']
const sources = ['Website', 'Referral', 'Walk-in', 'Call', 'Other']
const statuses = ['New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped']

export default function NewBuyerPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<Partial<CreateBuyerData>>({
    fullName: '',
    email: '',
    phone: '',
    city: 'Chandigarh',
    propertyType: 'Apartment',
    bhk: undefined,
    purpose: 'Buy',
    budgetMin: undefined,
    budgetMax: undefined,
    timeline: '0-3m',
    source: 'Website',
    status: 'New',
    notes: '',
    tags: [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      // Validate form data
      const validatedData = createBuyerSchema.parse({
        ...formData,
        email: formData.email || undefined,
        notes: formData.notes || undefined,
        bhk: formData.bhk || undefined,
      })

      const response = await fetch('/api/buyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create buyer')
      }

      const buyer = await response.json()
      router.push(`/buyers/${buyer.id}`)
    } catch (error: any) {
      if (error.issues) {
        // Zod validation errors
        const fieldErrors: Record<string, string> = {}
        error.issues.forEach((err: any) => {
          fieldErrors[err.path[0]] = err.message
        })
        setErrors(fieldErrors)
      } else {
        setErrors({ general: error.message })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateBuyerData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const requiresBhk = formData.propertyType === 'Apartment' || formData.propertyType === 'Villa'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Add New Buyer Lead</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Full Name *
            </label>
            <input
              type="text"
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className={`mt-1 block w-full rounded-md border ${errors.fullName ? 'border-red-300' : 'border-gray-300'} px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
              required
            />
            {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`mt-1 block w-full rounded-md border ${errors.email ? 'border-red-300' : 'border-gray-300'} px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone *
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="10-15 digits"
              className={`mt-1 block w-full rounded-md border ${errors.phone ? 'border-red-300' : 'border-gray-300'} px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
              required
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City *
            </label>
            <select
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Property Type */}
          <div>
            <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">
              Property Type *
            </label>
            <select
              id="propertyType"
              value={formData.propertyType}
              onChange={(e) => handleInputChange('propertyType', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {propertyTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* BHK - conditional */}
          {requiresBhk && (
            <div>
              <label htmlFor="bhk" className="block text-sm font-medium text-gray-700">
                BHK *
              </label>
              <select
                id="bhk"
                value={formData.bhk}
                onChange={(e) => handleInputChange('bhk', e.target.value)}
                className={`mt-1 block w-full rounded-md border ${errors.bhk ? 'border-red-300' : 'border-gray-300'} px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
              >
                <option value="">Select BHK</option>
                {bhkOptions.map(bhk => (
                  <option key={bhk} value={bhk}>{bhk}</option>
                ))}
              </select>
              {errors.bhk && <p className="mt-1 text-sm text-red-600">{errors.bhk}</p>}
            </div>
          )}

          {/* Purpose */}
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
              Purpose *
            </label>
            <select
              id="purpose"
              value={formData.purpose}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {purposes.map(purpose => (
                <option key={purpose} value={purpose}>{purpose}</option>
              ))}
            </select>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="budgetMin" className="block text-sm font-medium text-gray-700">
                Min Budget (₹)
              </label>
              <input
                type="number"
                id="budgetMin"
                value={formData.budgetMin || ''}
                onChange={(e) => handleInputChange('budgetMin', e.target.value ? parseInt(e.target.value) : undefined)}
                className={`mt-1 block w-full rounded-md border ${errors.budgetMin ? 'border-red-300' : 'border-gray-300'} px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                placeholder="5000000"
              />
              {errors.budgetMin && <p className="mt-1 text-sm text-red-600">{errors.budgetMin}</p>}
            </div>
            <div>
              <label htmlFor="budgetMax" className="block text-sm font-medium text-gray-700">
                Max Budget (₹)
              </label>
              <input
                type="number"
                id="budgetMax"
                value={formData.budgetMax || ''}
                onChange={(e) => handleInputChange('budgetMax', e.target.value ? parseInt(e.target.value) : undefined)}
                className={`mt-1 block w-full rounded-md border ${errors.budgetMax ? 'border-red-300' : 'border-gray-300'} px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                placeholder="10000000"
              />
              {errors.budgetMax && <p className="mt-1 text-sm text-red-600">{errors.budgetMax}</p>}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <label htmlFor="timeline" className="block text-sm font-medium text-gray-700">
              Timeline *
            </label>
            <select
              id="timeline"
              value={formData.timeline}
              onChange={(e) => handleInputChange('timeline', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {timelines.map(timeline => (
                <option key={timeline} value={timeline}>{timeline}</option>
              ))}
            </select>
          </div>

          {/* Source */}
          <div>
            <label htmlFor="source" className="block text-sm font-medium text-gray-700">
              Source *
            </label>
            <select
              id="source"
              value={formData.source}
              onChange={(e) => handleInputChange('source', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {sources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className={`mt-1 block w-full rounded-md border ${errors.notes ? 'border-red-300' : 'border-gray-300'} px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
              placeholder="Additional notes about the buyer..."
            />
            {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/buyers')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Buyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}