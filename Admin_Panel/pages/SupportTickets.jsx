import { useState, useEffect } from 'react'
import { 
  MessageSquare, 
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
  User,
  RefreshCw,
  Edit,
  CheckCheck
} from 'lucide-react'
import supabase from '../../src/supabase/supabse'

function SupportTickets() {
  const [tickets, setTickets] = useState([])
  const [filteredTickets, setFilteredTickets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [adminResponse, setAdminResponse] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0
  })

  useEffect(() => {
    fetchTickets()
  }, [])

  useEffect(() => {
    filterTickets()
    calculateStats()
  }, [tickets, searchTerm, statusFilter, priorityFilter])

  const fetchTickets = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
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

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.created_by_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.created_by_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredTickets(filtered)
  }

  const calculateStats = () => {
    setStats({
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
      urgent: tickets.filter(t => t.priority === 'urgent').length
    })
  }

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const updateData = {
        status: newStatus
      }

      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString()
        updateData.resolved_by = user?.id
      } else if (newStatus === 'closed') {
        updateData.closed_at = new Date().toISOString()
        // If not already resolved, set resolved_at and resolved_by when closing
        if (!selectedTicket?.resolved_at) {
          updateData.resolved_at = new Date().toISOString()
          updateData.resolved_by = user?.id
        }
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId)

      if (error) throw error

      alert('Status updated successfully!')

      // Refresh tickets list
      await fetchTickets()

      // Fetch the updated ticket to update the detail view
      const { data: updatedTicket } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single()

      if (updatedTicket) {
        setSelectedTicket(updatedTicket)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status: ' + error.message)
    }
  }

  const handleSubmitResponse = async (e) => {
    e.preventDefault()

    if (!adminResponse.trim()) {
      alert('Please enter a response')
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('support_tickets')
        .update({
          admin_response: adminResponse,
          responded_at: new Date().toISOString(),
          responded_by: user.id,
          status: 'in_progress'
        })
        .eq('id', selectedTicket.id)

      if (error) throw error

      alert('Response sent successfully!')
      setShowResponseModal(false)
      setAdminResponse('')
      fetchTickets()
      setSelectedTicket(null)
    } catch (error) {
      console.error('Error submitting response:', error)
      alert('Failed to submit response: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResolveTicket = async (ticketId, resolutionNotes) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
          resolution_notes: resolutionNotes || 'Ticket resolved by admin'
        })
        .eq('id', ticketId)

      if (error) throw error

      alert('Ticket resolved successfully!')
      fetchTickets()
      setSelectedTicket(null)
    } catch (error) {
      console.error('Error resolving ticket:', error)
      alert('Failed to resolve ticket: ' + error.message)
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
    if (!dateString) return 'N/A'
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
              Support Tickets
            </h1>
            <p className="text-white/80">Manage and respond to user support requests</p>
          </div>
          <button
            onClick={fetchTickets}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            title="Refresh tickets"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 font-medium">Total Tickets</span>
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-[#336b6e]">{stats.total}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-600 font-medium">Open</span>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.open}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-yellow-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-yellow-600 font-medium">In Progress</span>
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-yellow-600">{stats.inProgress}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-600 font-medium">Resolved</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-red-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-red-600 font-medium">Urgent</span>
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">{stats.urgent}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets, users..."
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

          {/* Priority Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58] transition-all appearance-none bg-white"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
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
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No support tickets have been created yet'}
            </p>
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
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.color} flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusBadge.label}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                        {ticket.created_by_role.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#336b6e] mb-2">{ticket.subject}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{ticket.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{ticket.created_by_name}</span>
                      <span>•</span>
                      <span>{ticket.created_by_email}</span>
                    </div>
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
                  <div className="flex items-center gap-2">
                    {ticket.admin_response && (
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Responded
                      </span>
                    )}
                    {!ticket.admin_response && ticket.status === 'open' && (
                      <span className="text-orange-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Needs Response
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && !showResponseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-6 flex items-center justify-between z-10">
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
              <div className="flex items-center gap-3 flex-wrap">
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
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-purple-100 text-purple-700">
                  {selectedTicket.created_by_role.toUpperCase()}
                </span>
              </div>

              {/* User Info */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-[#336b6e] mb-3 uppercase tracking-wide">Submitted By</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-[#bb9f58]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#336b6e]">{selectedTicket.created_by_name}</p>
                    <p className="text-sm text-gray-500">{selectedTicket.created_by_email}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-[#336b6e] mb-3 uppercase tracking-wide">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {/* Admin Response */}
              {selectedTicket.admin_response ? (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wide">Admin Response</h3>
                    </div>
                    {selectedTicket.responded_at && (
                      <span className="text-xs text-green-600">
                        {formatDate(selectedTicket.responded_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap mb-4">{selectedTicket.admin_response}</p>
                  <button
                    onClick={() => {
                      setAdminResponse(selectedTicket.admin_response)
                      setShowResponseModal(true)
                    }}
                    className="text-sm text-green-700 hover:text-green-800 font-medium flex items-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Response
                  </button>
                </div>
              ) : (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                  <p className="text-orange-700 font-medium mb-4">No admin response yet</p>
                  <button
                    onClick={() => setShowResponseModal(true)}
                    className="px-6 py-3 bg-[#336b6e] hover:bg-[#2a5557] text-white rounded-xl font-semibold inline-flex items-center gap-2 transition-all"
                  >
                    <Send className="w-5 h-5" />
                    Add Response
                  </button>
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

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                      className="flex-1 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      <AlertCircle className="w-5 h-5" />
                      Mark In Progress
                    </button>
                    <button
                      onClick={() => {
                        const notes = prompt('Enter resolution notes (optional):')
                        handleResolveTicket(selectedTicket.id, notes)
                      }}
                      className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      <CheckCheck className="w-5 h-5" />
                      Resolve Ticket
                    </button>
                  </>
                )}
                {selectedTicket.status === 'resolved' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}
                    className="flex-1 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <XCircle className="w-5 h-5" />
                    Close Ticket
                  </button>
                )}
                {selectedTicket.status === 'closed' && (
                  <div className="flex-1 px-6 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-center">
                    <p className="text-gray-600 font-semibold flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5 text-gray-500" />
                      This ticket has been closed
                    </p>
                    {selectedTicket.closed_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Closed on {formatDate(selectedTicket.closed_at)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-6 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Send className="w-6 h-6" />
                {adminResponse ? 'Edit Response' : 'Add Response'}
              </h2>
              <button
                onClick={() => {
                  setShowResponseModal(false)
                  setAdminResponse('')
                }}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitResponse} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#336b6e] mb-2">
                  Response Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Enter your response to the user..."
                  rows={8}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58] transition-all resize-none"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowResponseModal(false)
                    setAdminResponse('')
                  }}
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
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Response
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupportTickets

