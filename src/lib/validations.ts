import { z } from 'zod'

// Enum definitions
export const cityEnum = z.enum(['Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other'])
export const propertyTypeEnum = z.enum(['Apartment', 'Villa', 'Plot', 'Office', 'Retail'])
export const bhkEnum = z.enum(['1', '2', '3', '4', 'Studio'])
export const purposeEnum = z.enum(['Buy', 'Rent'])
export const timelineEnum = z.enum(['0-3m', '3-6m', '>6m', 'Exploring'])
export const sourceEnum = z.enum(['Website', 'Referral', 'Walk-in', 'Call', 'Other'])
export const statusEnum = z.enum(['New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped'])

// Phone validation - Indian phone numbers (10-15 digits)
const phoneRegex = /^\d{10,15}$/

// Email validation (optional but valid if provided)
const emailSchema = z.string().email().optional().or(z.literal(''))

// Budget validation helper
const budgetSchema = z.number().int().min(0).optional()

// Base buyer schema
export const buyerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(80, 'Full name must be less than 80 characters'),
  email: emailSchema,
  phone: z.string().regex(phoneRegex, 'Phone must be 10-15 digits'),
  city: cityEnum,
  propertyType: propertyTypeEnum,
  bhk: bhkEnum.optional(),
  purpose: purposeEnum,
  budgetMin: budgetSchema,
  budgetMax: budgetSchema,
  timeline: timelineEnum,
  source: sourceEnum,
  status: statusEnum.default('New'),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  tags: z.array(z.string()).optional().default([]),
}).superRefine((data, ctx) => {
  // BHK validation: required for Apartment and Villa
  if ((data.propertyType === 'Apartment' || data.propertyType === 'Villa') && !data.bhk) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'BHK is required for Apartment and Villa properties',
      path: ['bhk'],
    })
  }

  // Budget validation: budgetMax must be >= budgetMin if both are present
  if (data.budgetMin && data.budgetMax && data.budgetMax < data.budgetMin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Maximum budget must be greater than or equal to minimum budget',
      path: ['budgetMax'],
    })
  }
})

// Schema for creating new buyers
export const createBuyerSchema = buyerSchema

// Schema for updating buyers (all fields optional except required ones)
export const updateBuyerSchema = buyerSchema.partial().extend({
  id: z.string(),
  updatedAt: z.number().optional(), // For optimistic concurrency control
})

// Schema for CSV import
export const csvBuyerSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().regex(phoneRegex),
  city: cityEnum,
  propertyType: propertyTypeEnum,
  bhk: bhkEnum.optional().or(z.literal('')),
  purpose: purposeEnum,
  budgetMin: z.string().transform((val) => val === '' ? undefined : parseInt(val)).pipe(budgetSchema).optional(),
  budgetMax: z.string().transform((val) => val === '' ? undefined : parseInt(val)).pipe(budgetSchema).optional(),
  timeline: timelineEnum,
  source: sourceEnum,
  notes: z.string().max(1000).optional().or(z.literal('')),
  tags: z.string().transform((val) => val === '' ? [] : val.split(',').map(tag => tag.trim())).optional(),
  status: statusEnum.default('New'),
}).superRefine((data, ctx) => {
  // Same validations as buyerSchema
  if ((data.propertyType === 'Apartment' || data.propertyType === 'Villa') && !data.bhk) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'BHK is required for Apartment and Villa properties',
      path: ['bhk'],
    })
  }

  if (data.budgetMin && data.budgetMax && data.budgetMax < data.budgetMin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Maximum budget must be greater than or equal to minimum budget',
      path: ['budgetMax'],
    })
  }
})

// Search and filter schema
export const buyerFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  search: z.string().optional(),
  city: cityEnum.optional(),
  propertyType: propertyTypeEnum.optional(),
  status: statusEnum.optional(),
  timeline: timelineEnum.optional(),
  sortBy: z.enum(['updatedAt', 'createdAt', 'fullName']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Type exports
export type BuyerFormData = z.infer<typeof buyerSchema>
export type CreateBuyerData = z.infer<typeof createBuyerSchema>
export type UpdateBuyerData = z.infer<typeof updateBuyerSchema>
export type CsvBuyerData = z.infer<typeof csvBuyerSchema>
export type BuyerFilters = z.infer<typeof buyerFiltersSchema>