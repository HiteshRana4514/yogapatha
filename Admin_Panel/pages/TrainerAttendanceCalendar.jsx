import React, { useState, useEffect } from 'react'
import { 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  User,
  Plus,
  X,
  FileText
} from 'lucide-react'

function TrainerAttendanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [attendanceData, setAttendanceData] = useState({})
  const [assignedClients, setAssignedClients] = useState([])

  // Mock assigned clients - Replace with Supabase data
  useEffect(() => {
    // TODO: Fetch assigned clients from Supabase
    // const { data } = await supabase
    //   .from('trainer_clients')
    //   .select('*, clients(*)')
    //   .eq('trainer_id', trainerId)
    
    setAssignedClients([
      { 
        id: 1, 
        name: 'Sarah Johnson', 
        email: 'sarah@email.com',
        schedule: 'Mon, Wed, Fri - 10:00 AM'
      },
      { 
        id: 2, 
        name: 'Mike Rodriguez', 
        email: 'mike@email.com',
        schedule: 'Tue, Thu - 2:00 PM'
      },
      { 
        id: 3, 
        name: 'Emma Chen', 
        email: 'emma@email.com',
        schedule: 'Mon, Wed, Fri - 4:00 PM'
      }
    ])

    // Mock attendance data
    // TODO: Fetch from Supabase
    setAttendanceData({
      '2024-01-15-1': { status: 'completed', note: '' },
      '2024-01-15-2': { status: 'pending', note: '' },
      '2024-01-16-1': { status: 'leave', note: 'Trainer sick leave' },
      '2024-01-17-3': { status: 'cancelled_client', note: 'Client family emergency' }
    })
  }, [])

  const getMonthData = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { year, month, daysInMonth, startingDayOfWeek }
  }

  const { year, month, daysInMonth, startingDayOfWeek } = getMonthData()
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getDateKey = (day, clientId) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}-${clientId}`
  }

  const getAttendanceForDate = (day) => {
    const attendance = []
    assignedClients.forEach(client => {
      const key = getDateKey(day, client.id)
      if (attendanceData[key]) {
        attendance.push({
          client,
          ...attendanceData[key]
        })
      }
    })
    return attendance
  }

  const hasAttendance = (day) => {
    return getAttendanceForDate(day).length > 0
  }

  const getAttendanceStats = (day) => {
    const attendance = getAttendanceForDate(day)
    const stats = {
      completed: 0,
      pending: 0,
      leave: 0,
      cancelled: 0
    }

    attendance.forEach(item => {
      if (item.status === 'completed') stats.completed++
      else if (item.status === 'pending') stats.pending++
      else if (item.status === 'leave') stats.leave++
      else if (item.status.includes('cancelled')) stats.cancelled++
    })

    return stats
  }

  const handleDateClick = (day) => {
    const clickedDate = new Date(year, month, day)
    setSelectedDate(clickedDate)
  }

  const handleMarkAttendance = (client) => {
    setSelectedClient(client)
    setShowMarkAttendanceModal(true)
  }

  const saveAttendance = async (status, note) => {
    if (!selectedDate || !selectedClient) return

    const day = selectedDate.getDate()
    const key = getDateKey(day, selectedClient.id)

    // TODO: Save to Supabase
    // const { error } = await supabase
    //   .from('attendance')
    //   .upsert({
    //     date: selectedDate.toISOString().split('T')[0],
    //     trainer_id: trainerId,
    //     client_id: selectedClient.id,
    //     status: status,
    //     note: note
    //   })

    setAttendanceData({
      ...attendanceData,
      [key]: { status, note }
    })

    setShowMarkAttendanceModal(false)
    setSelectedClient(null)
  }

  const getStatusBadge = (status) => {
    const config = {
      completed: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: CheckCircle,
        label: 'Completed'
      },
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: Clock,
        label: 'Pending'
      },
      leave: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        icon: AlertCircle,
        label: 'Leave'
      },
      cancelled_client: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: XCircle,
        label: 'Cancelled by Client'
      },
      cancelled_trainer: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: XCircle,
        label: 'Cancelled by Trainer'
      }
    }

    const { bg, text, icon: Icon, label } = config[status] || config.pending
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    )
  }

  const renderCalendarDays = () => {
    const days = []
    const blanks = []
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      blanks.push(
        <div key={`blank-${i}`} className="p-2 border border-gray-100"></div>
      )
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = 
        day === new Date().getDate() &&
        month === new Date().getMonth() &&
        year === new Date().getFullYear()

      const isSelected = 
        selectedDate &&
        day === selectedDate.getDate() &&
        month === selectedDate.getMonth() &&
        year === selectedDate.getFullYear()

      const hasData = hasAttendance(day)
      const stats = getAttendanceStats(day)

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          className={`min-h-24 p-2 border border-gray-200 cursor-pointer transition-all duration-200 hover:bg-[#fdfcf3] ${
            isToday ? 'bg-blue-50 border-blue-300' : ''
          } ${isSelected ? 'bg-[#bb9f58]/10 border-[#bb9f58] ring-2 ring-[#bb9f58]' : ''}`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className={`text-sm font-semibold ${
              isToday ? 'text-blue-600' : 'text-[#336b6e]'
            }`}>
              {day}
            </span>
            {isToday && (
              <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                Today
              </span>
            )}
          </div>

          {hasData && (
            <div className="space-y-1">
              {stats.completed > 0 && (
                <div className="flex items-center gap-1 text-xs text-green-700">
                  <CheckCircle className="w-3 h-3" />
                  <span>{stats.completed}</span>
                </div>
              )}
              {stats.pending > 0 && (
                <div className="flex items-center gap-1 text-xs text-yellow-700">
                  <Clock className="w-3 h-3" />
                  <span>{stats.pending}</span>
                </div>
              )}
              {stats.leave > 0 && (
                <div className="flex items-center gap-1 text-xs text-orange-700">
                  <AlertCircle className="w-3 h-3" />
                  <span>{stats.leave}</span>
                </div>
              )}
              {stats.cancelled > 0 && (
                <div className="flex items-center gap-1 text-xs text-red-700">
                  <XCircle className="w-3 h-3" />
                  <span>{stats.cancelled}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )
    }

    return [...blanks, ...days]
  }

  return (
    <div className="p-6 bg-[#fdfcf3] min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#336b6e] mb-2">Class Attendance Calendar</h1>
          <p className="text-[#336b6e] opacity-80">
            Mark attendance for your client sessions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              
              {/* Calendar Header */}
              <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={previousMonth}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <h2 className="text-2xl font-bold">
                    {monthNames[month]} {year}
                  </h2>

                  <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                <button
                  onClick={goToToday}
                  className="w-full bg-[#bb9f58] text-white py-2 px-4 rounded-lg hover:bg-[#a08a4a] transition-colors font-semibold"
                >
                  Go to Today
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="p-4">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-semibold text-[#336b6e] p-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7">
                  {renderCalendarDays()}
                </div>
              </div>

              {/* Legend */}
              <div className="bg-[#fdfcf3] p-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-[#336b6e] mb-3">Legend:</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-[#336b6e]">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs text-[#336b6e]">Pending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-xs text-[#336b6e]">Leave</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-xs text-[#336b6e]">Cancelled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Selected Date Info */}
            {selectedDate && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-[#336b6e] mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>

                <div className="space-y-4">
                  {assignedClients.map(client => {
                    const day = selectedDate.getDate()
                    const key = getDateKey(day, client.id)
                    const attendance = attendanceData[key]

                    return (
                      <div key={client.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-[#bb9f58] transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-[#336b6e]">{client.name}</p>
                              <p className="text-xs text-gray-500">{client.schedule}</p>
                            </div>
                          </div>
                        </div>

                        {attendance ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Status:</span>
                              {getStatusBadge(attendance.status)}
                            </div>
                            {attendance.note && (
                              <div className="bg-[#fdfcf3] p-2 rounded text-xs text-[#336b6e]">
                                <strong>Note:</strong> {attendance.note}
                              </div>
                            )}
                            <button
                              onClick={() => handleMarkAttendance(client)}
                              className="w-full text-sm text-[#bb9f58] hover:text-[#a08a4a] font-semibold transition-colors"
                            >
                              Update Status
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleMarkAttendance(client)}
                            className="w-full flex items-center justify-center gap-2 bg-[#336b6e] text-[#bb9f58] py-2 px-4 rounded-lg hover:bg-[#2a5557] transition-colors font-semibold"
                          >
                            <Plus className="w-4 h-4" />
                            Mark Attendance
                          </button>
                        )}
                      </div>
                    )
                  })}

                  {assignedClients.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No clients assigned</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Assigned Clients Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-[#336b6e] mb-4">Assigned Clients</h3>
              <div className="space-y-3">
                {assignedClients.map(client => (
                  <div key={client.id} className="flex items-center gap-3 p-3 bg-[#fdfcf3] rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#336b6e] text-sm">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.schedule}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {showMarkAttendanceModal && selectedClient && (
        <AttendanceModal
          client={selectedClient}
          date={selectedDate}
          onClose={() => {
            setShowMarkAttendanceModal(false)
            setSelectedClient(null)
          }}
          onSave={saveAttendance}
          existingAttendance={attendanceData[getDateKey(selectedDate.getDate(), selectedClient.id)]}
        />
      )}
    </div>
  )
}

// Attendance Modal Component
function AttendanceModal({ client, date, onClose, onSave, existingAttendance }) {
  const [selectedStatus, setSelectedStatus] = useState(existingAttendance?.status || '')
  const [note, setNote] = useState(existingAttendance?.note || '')
  const [showNoteField, setShowNoteField] = useState(false)

  const statusOptions = [
    { 
      value: 'completed', 
      label: 'Completed', 
      icon: CheckCircle, 
      color: 'bg-green-500',
      description: 'Class successfully completed'
    },
    { 
      value: 'pending', 
      label: 'Pending', 
      icon: Clock, 
      color: 'bg-yellow-500',
      description: 'Class scheduled but not completed'
    },
    { 
      value: 'leave', 
      label: 'Trainer Leave', 
      icon: AlertCircle, 
      color: 'bg-orange-500',
      description: 'Trainer on leave',
      requiresNote: true
    },
    { 
      value: 'cancelled_client', 
      label: 'Cancelled by Client', 
      icon: XCircle, 
      color: 'bg-red-500',
      description: 'Client cancelled the class',
      requiresNote: true
    },
    { 
      value: 'cancelled_trainer', 
      label: 'Cancelled by Trainer', 
      icon: XCircle, 
      color: 'bg-red-500',
      description: 'Trainer cancelled the class',
      requiresNote: true
    }
  ]

  const handleStatusSelect = (status) => {
    setSelectedStatus(status)
    const option = statusOptions.find(opt => opt.value === status)
    if (option?.requiresNote) {
      setShowNoteField(true)
    }
  }

  const handleSave = () => {
    if (!selectedStatus) {
      alert('Please select a status')
      return
    }

    const option = statusOptions.find(opt => opt.value === selectedStatus)
    if (option?.requiresNote && !note.trim()) {
      alert('Please provide a reason')
      return
    }

    onSave(selectedStatus, note)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Mark Attendance</h2>
            <p className="text-white/80">
              {client.name} - {date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          
          {/* Status Selection */}
          <div>
            <label className="block text-lg font-semibold text-[#336b6e] mb-4">
              Select Status
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {statusOptions.map((option) => {
                const Icon = option.icon
                const isSelected = selectedStatus === option.value
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleStatusSelect(option.value)}
                    className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                      isSelected 
                        ? 'border-[#bb9f58] bg-[#bb9f58]/10 shadow-lg' 
                        : 'border-gray-200 hover:border-[#bb9f58] hover:bg-[#fdfcf3]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 ${option.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-[#336b6e] mb-1">{option.label}</h3>
                        <p className="text-xs text-gray-600">{option.description}</p>
                        {option.requiresNote && (
                          <p className="text-xs text-[#bb9f58] mt-1 font-semibold">* Requires reason</p>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-[#bb9f58]" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Note/Reason Field */}
          {(showNoteField || note) && (
            <div>
              <label className="block text-lg font-semibold text-[#336b6e] mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Reason / Note
                {statusOptions.find(opt => opt.value === selectedStatus)?.requiresNote && (
                  <span className="text-red-500 text-sm">*</span>
                )}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter reason or additional notes..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58] resize-vertical"
              />
            </div>
          )}

          {!showNoteField && !note && (
            <button
              onClick={() => setShowNoteField(true)}
              className="text-[#bb9f58] hover:text-[#a08a4a] font-semibold text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Note (Optional)
            </button>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-6 border-t border-gray-200 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedStatus}
            className="flex-1 px-6 py-3 bg-[#336b6e] text-[#bb9f58] rounded-xl font-semibold hover:bg-[#2a5557] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Save Attendance
          </button>
        </div>
      </div>
    </div>
  )
}

export default TrainerAttendanceCalendar