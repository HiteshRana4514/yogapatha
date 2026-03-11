import { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Send,
  X,
  FileText,
  Calendar,
  User
} from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import supabase from '../../supabase/supabse'

function HelpSupport() {
  const { userData } = useOutletContext()
  const [tickets, setTickets] = useState([])
  const [filteredTickets, setFilteredTickets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'general_inquiry',
    priority: 'medium'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (userData?.id) {
      fetchTickets()
    }
  }, [userData])

  useEffect(() => {
    filterTickets()
  }, [tickets, searchTerm, statusFilter])

  const fetchTickets = async () => {
    if (!userData?.id) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('created_by', userData.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTickets(data || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
      alert('Failed to load tickets')
    } finally {
      setIsLoading(false)
    }
  }

  const filterTickets = () => {
    let filtered = tickets

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredTickets(filtered)
  }

  const generateTicketNumber = () => {
    const date = new Date()
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, '')
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `TKT-${datePart}-${randomPart}`
  }

  const handleCreateTicket = async (e) => {
    e.preventDefault()

    if (!formData.subject || !formData.description) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const ticketNumber = generateTicketNumber()

      const { error } = await supabase
        .from('support_tickets')
        .insert({
          ticket_number: ticketNumber,
          subject: formData.subject,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          created_by: userData.id,
          created_by_role: 'trainer',
          created_by_name: `${userData.user_metadata?.firstName || ''} ${userData.user_metadata?.lastName || ''}`.trim(),
          created_by_email: userData.email,
          status: 'open'
        })

      if (error) throw error

      alert('Ticket created successfully!')
      setShowCreateModal(false)
      setFormData({
        subject: '',
        description: '',
        category: 'general_inquiry',
        priority: 'medium'
      })
      fetchTickets()
    } catch (error) {
      console.error('Error creating ticket:', error)
      alert('Failed to create ticket: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      open: { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Open' },
      in_progress: { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, label: 'In Progress' },
      waiting_response: { color: 'bg-orange-100 text-orange-700', icon: MessageSquare, label: 'Waiting Response' },
      resolved: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Resolved' },
      closed: { color: 'bg-gray-100 text-gray-700', icon: XCircle, label: 'Closed' }
    }
    return badges[status] || badges.open
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700'
    }
    return badges[priority] || badges.medium
  }

  const getCategoryLabel = (category) => {
    const labels = {
      technical_issue: 'Technical Issue',
      billing: 'Billing',
      account: 'Account',
      client_management: 'Client Management',
      feature_request: 'Feature Request',
      general_inquiry: 'General Inquiry',
      other: 'Other'
    }
    return labels[category] || category
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 text-[#336b6e] animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gradient-to-br from-[#fdfcf3] to-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] rounded-2xl p-6 lg:p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
              <MessageSquare className="w-8 h-8" />
              Help & Support
            </h1>
            <p className="text-white/80">Create and manage your support tickets</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-[#bb9f58] hover:bg-[#a08a4a] text-white rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Ticket</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58] transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58] transition-all appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_response">Waiting Response</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg border-2 border-gray-100">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#336b6e] mb-2">No Tickets Found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Create your first support ticket to get help'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-[#336b6e] hover:bg-[#2a5557] text-white rounded-xl font-semibold inline-flex items-center gap-2 transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Ticket
              </button>
            )}
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const statusBadge = getStatusBadge(ticket.status)
            const StatusIcon = statusBadge.icon

            return (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-[#bb9f58] hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.color} flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusBadge.label}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#336b6e] mb-2">{ticket.subject}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{ticket.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {getCategoryLabel(ticket.category)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(ticket.created_at)}
                    </span>
                  </div>
                  {ticket.admin_response && (
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Admin Responded
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Plus className="w-6 h-6" />
                Create Support Ticket
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-6">
              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-[#336b6e] mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58] transition-all"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-[#336b6e] mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58] transition-all"
                  required
                >
                  <option value="general_inquiry">General Inquiry</option>
                  <option value="technical_issue">Technical Issue</option>
                  <option value="billing">Billing</option>
                  <option value="account">Account</option>
                  <option value="client_management">Client Management</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-[#336b6e] mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58] transition-all"
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-[#336b6e] mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed information about your issue..."
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58] transition-all resize-none"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-[#336b6e] hover:bg-[#2a5557] text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Create Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{selectedTicket.subject}</h2>
                <p className="text-white/80 text-sm font-mono">{selectedTicket.ticket_number}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status and Priority */}
              <div className="flex items-center gap-3">
                {(() => {
                  const statusBadge = getStatusBadge(selectedTicket.status)
                  const StatusIcon = statusBadge.icon
                  return (
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusBadge.color} flex items-center gap-2`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusBadge.label}
                    </span>
                  )
                })()}
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getPriorityBadge(selectedTicket.priority)}`}>
                  {selectedTicket.priority.toUpperCase()} PRIORITY
                </span>
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
                  {getCategoryLabel(selectedTicket.category)}
                </span>
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-[#336b6e] mb-3 uppercase tracking-wide">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {/* Admin Response */}
              {selectedTicket.admin_response && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-green-600" />
                    <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wide">Admin Response</h3>
                    {selectedTicket.responded_at && (
                      <span className="text-xs text-green-600 ml-auto">
                        {formatDate(selectedTicket.responded_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.admin_response}</p>
                </div>
              )}

              {/* Resolution Notes */}
              {selectedTicket.resolution_notes && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wide">Resolution</h3>
                    {selectedTicket.resolved_at && (
                      <span className="text-xs text-blue-600 ml-auto">
                        {formatDate(selectedTicket.resolved_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.resolution_notes}</p>
                </div>
              )}

              {/* Ticket Info */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Created</p>
                  <p className="text-sm font-semibold text-[#336b6e]">{formatDate(selectedTicket.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                  <p className="text-sm font-semibold text-[#336b6e]">{formatDate(selectedTicket.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HelpSupport


