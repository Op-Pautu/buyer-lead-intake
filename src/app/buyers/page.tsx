import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getBuyers } from '@/lib/buyers'
import { buyerFiltersSchema } from '@/lib/validations'
import Link from 'next/link'

interface SearchParams {
  page?: string
  search?: string
  city?: string
  propertyType?: string
  status?: string
  timeline?: string
  sortBy?: string
  sortOrder?: string
}

function formatBudget(min?: number | null, max?: number | null) {
  if (!min && !max) return 'Not specified'
  if (min && max) return `₹${(min/100000).toFixed(1)}L - ₹${(max/100000).toFixed(1)}L`
  if (min) return `₹${(min/100000).toFixed(1)}L+`
  return `Up to ₹${(max!/100000).toFixed(1)}L`
}

function formatDate(date: Date | number) {
  const d = typeof date === 'number' ? new Date(date * 1000) : date
  return d.toLocaleDateString('en-IN')
}

export default async function BuyersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Parse and validate search params
  const filters = buyerFiltersSchema.parse(searchParams)
  
  // Get buyers data
  const { buyers, pagination } = await getBuyers(filters)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Buyer Leads</h1>
          <p className="text-gray-600 mt-2">
            Total: {pagination.totalCount} leads | Page {pagination.page} of {pagination.totalPages}
          </p>
        </div>
        <Link
          href="/buyers/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium"
        >
          Add New Buyer
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {buyers.map((buyer) => (
              <tr key={buyer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{buyer.fullName}</div>
                  {buyer.email && <div className="text-sm text-gray-500">{buyer.email}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{buyer.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{buyer.city}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{buyer.propertyType}</div>
                  {buyer.bhk && <div className="text-sm text-gray-500">{buyer.bhk} BHK</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatBudget(buyer.budgetMin, buyer.budgetMax)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{buyer.timeline}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    buyer.status === 'New' ? 'bg-blue-100 text-blue-800' :
                    buyer.status === 'Qualified' ? 'bg-green-100 text-green-800' :
                    buyer.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
                    buyer.status === 'Converted' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {buyer.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(buyer.updatedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link href={`/buyers/${buyer.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    View
                  </Link>
                  <Link href={`/buyers/${buyer.id}/edit`} className="text-green-600 hover:text-green-900">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {buyers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No buyer leads found.</p>
            <Link href="/buyers/new" className="text-indigo-600 hover:text-indigo-500 mt-2 inline-block">
              Create your first buyer lead
            </Link>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              {pagination.hasPreviousPage && (
                <Link
                  href={`?page=${pagination.page - 1}`}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {pagination.hasNextPage && (
                <Link
                  href={`?page=${pagination.page + 1}`}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.page - 1) * pagination.pageSize + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Link
                      key={pageNum}
                      href={`?page=${pageNum}`}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === pagination.page
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
