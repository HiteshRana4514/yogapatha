import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Eye,
  X,
  Mail,
  Phone,
  MapPin,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  MoreVertical,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  UserCog,
  Plus
} from "lucide-react";
import supabase from "../../src/supabase/supabse";
import { sendClientAssignmentNotification } from "../../src/utils/emailService";

function ClientsQueryPage() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedClient, setSelectedClient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Trainer assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClientForAssign, setSelectedClientForAssign] = useState(null);
  const [allTrainers, setAllTrainers] = useState([]);
  const [filteredTrainers, setFilteredTrainers] = useState([]);
  const [trainerSearchTerm, setTrainerSearchTerm] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Mock data - Replace with Supabase fetch
  useEffect(() => {
    fetchClients();
    fetchTrainers();
    fetchAllTrainers();
  }, []);

  const fetchTrainers = async () => {
    const { data, error } = await supabase.from("trainer_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);

    }
    else {
    }
  }

  const fetchClients = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .in("status", ["pending", "contacted"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      setClients(data);
      setFilteredClients(data);

      // const mockData = [
      //   {
      //     id: 1,
      //     first_name: 'Sarah',
      //     last_name: 'Johnson',
      //     email: 'sarah.johnson@email.com',
      //     phone: '+1 (555) 123-4567',
      //     street: '123 Main Street',
      //     city: 'New York',
      //     state: 'NY',
      //     pincode: '10001',
      //     country: 'USA',
      //     status: 'pending',
      //     created_at: '2024-01-15T10:30:00'
      //   },
      //   {
      //     id: 2,
      //     first_name: 'Mike',
      //     last_name: 'Rodriguez',
      //     email: 'mike.rodriguez@email.com',
      //     phone: '+1 (555) 234-5678',
      //     street: '456 Oak Avenue',
      //     city: 'Los Angeles',
      //     state: 'CA',
      //     pincode: '90001',
      //     country: 'USA',
      //     status: 'contacted',
      //     created_at: '2024-01-14T14:20:00'
      //   },
      //   {
      //     id: 3,
      //     first_name: 'Emma',
      //     last_name: 'Chen',
      //     email: 'emma.chen@email.com',
      //     phone: '+1 (555) 345-6789',
      //     street: '789 Pine Road',
      //     city: 'Chicago',
      //     state: 'IL',
      //     pincode: '60601',
      //     country: 'USA',
      //     status: 'onboarded',
      //     created_at: '2024-01-13T09:15:00'
      //   },
      //   {
      //     id: 4,
      //     first_name: 'David',
      //     last_name: 'Lee',
      //     email: 'david.lee@email.com',
      //     phone: '+1 (555) 456-7890',
      //     street: '321 Elm Street',
      //     city: 'Houston',
      //     state: 'TX',
      //     pincode: '77001',
      //     country: 'USA',
      //     status: 'pending',
      //     created_at: '2024-01-12T16:45:00'
      //   },
      //   {
      //     id: 5,
      //     first_name: 'Jennifer',
      //     last_name: 'Walsh',
      //     email: 'jennifer.walsh@email.com',
      //     phone: '+1 (555) 567-8901',
      //     street: '654 Maple Drive',
      //     city: 'Phoenix',
      //     state: 'AZ',
      //     pincode: '85001',
      //     country: 'USA',
      //     status: 'contacted',
      //     created_at: '2024-01-11T11:30:00'
      //   },
      //   {
      //     id: 6,
      //     first_name: 'Robert',
      //     last_name: 'Kim',
      //     email: 'robert.kim@email.com',
      //     phone: '+1 (555) 678-9012',
      //     street: '987 Cedar Lane',
      //     city: 'Philadelphia',
      //     state: 'PA',
      //     pincode: '19101',
      //     country: 'USA',
      //     status: 'onboarded',
      //     created_at: '2024-01-10T13:20:00'
      //   }
      // ]

      // setClients(mockData)
      // setFilteredClients(mockData)
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Search and Filter
  useEffect(() => {
    let result = [...clients];

    // 👇 Hide onboarded clients
    result = result.filter((client) => client.status !== "onboarded");

    // Search filter
    if (searchTerm) {
      result = result.filter(
        (client) =>
          client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone.includes(searchTerm) ||
          client.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((client) => client.status === statusFilter);
    }

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredClients(result);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortConfig, clients]);

  useEffect(() => {
    if (trainerSearchTerm.trim() === '') {
      setFilteredTrainers(allTrainers)
    } else {
      const filtered = allTrainers.filter(trainer =>
        `${trainer.first_name} ${trainer.last_name}`.toLowerCase().includes(trainerSearchTerm.toLowerCase()) ||
        trainer.email.toLowerCase().includes(trainerSearchTerm.toLowerCase()) ||
        trainer.city.toLowerCase().includes(trainerSearchTerm.toLowerCase())
      )
      setFilteredTrainers(filtered)
    }
  }, [trainerSearchTerm, allTrainers])

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: Clock,
        label: "Pending",
      },
      contacted: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        icon: Mail,
        label: "Contacted",
      },
      onboarded: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
        label: "Onboarded",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
      >
        <IconComponent className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const handleViewClient = (client) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  const fetchAllTrainers = async () => {
    try {
      // Fetch all users with trainer role from Edge Function
      const response = await fetch(`${import.meta.env.VITE_PROJECT_URL}/functions/v1/get-all-users`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_ANON_KEY}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch users')
      const users = await response.json()

      // Filter only trainers
      const trainerUsers = users.filter(user => user.user_metadata?.role === 'trainer')

      // Fetch trainer profiles
      const { data: trainerProfiles, error } = await supabase
        .from('trainer_profiles')
        .select('*')
        .in('user_id', trainerUsers.map(u => u.id))

      if (error) throw error

      // Merge and filter for active trainers with approved KYC
      const mergedTrainers = trainerUsers.map(user => {
        const profile = trainerProfiles?.find(p => p.user_id === user.id)
        const metadata = user.user_metadata || {}

        return {
          id: profile?.id || user.id,
          user_id: user.id,
          first_name: metadata.firstName || metadata.first_name || 'N/A',
          last_name: metadata.lastName || metadata.last_name || 'N/A',
          email: user.email || 'N/A',
          phone: metadata.phone || 'N/A',
          city: metadata.city || 'N/A',
          state: metadata.state || 'N/A',
          experience: metadata.experience || 'N/A',
          kyc_status: profile?.kyc_status || 'pending',
          is_active: profile?.is_active !== undefined ? profile.is_active : true,
          has_trainer_profile: !!profile
        }
      })

      const activeTrainers = mergedTrainers.filter(t => t.is_active && t.kyc_status === 'approved')
      setAllTrainers(activeTrainers)
      setFilteredTrainers(activeTrainers)
    } catch (error) {
      console.error('Error fetching trainers:', error)
    }
  }

  const handleOpenAssignModal = (client) => {
    // Allow assignment for clients with NULL class_type or 'demo' class_type
    // This will convert NULL to 'demo' when assigning
    setSelectedClientForAssign(client)
    setSelectedTrainer(null)
    setTrainerSearchTerm('')
    setShowAssignModal(true)
  }

  const handleAssignTrainer = async () => {
    if (!selectedTrainer) {
      alert('Please select a trainer')
      return
    }

    setIsAssigning(true)
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          trainer_id: selectedTrainer.id,
          status: 'onboarded',
          class_type: selectedClientForAssign.class_type || 'demo'
        })
        .eq('id', selectedClientForAssign.id)

      if (error) throw error

      // Send email notification to trainer
      try {
        await sendClientAssignmentNotification(selectedTrainer.email, {
          clientName: `${selectedClientForAssign.first_name} ${selectedClientForAssign.last_name}`,
          clientEmail: selectedClientForAssign.email,
          clientPhone: selectedClientForAssign.phone,
          classType: 'demo',
          assignedDate: new Date().toISOString()
        })
      } catch (emailError) {
        console.error('Error sending trainer email:', emailError)
      }

      alert('Trainer assigned successfully! Client has been onboarded.')
      setShowAssignModal(false)
      setSelectedClientForAssign(null)
      setSelectedTrainer(null)
      setTrainerSearchTerm('')
      fetchClients()
    } catch (error) {
      console.error('Error assigning trainer:', error)
      alert('Failed to assign trainer: ' + error.message)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleStatusChange = async (clientId, newStatus) => {

    try {
      const { error } = await supabase
        .from("clients")
        .update({ status: newStatus })
        .eq("id", clientId)
        .select();

      if (error) throw error;

      // Update local state
      setClients(
        clients.map((client) =>
          client.id === clientId ? { ...client, status: newStatus } : client
        )
      );

      if (selectedClient?.id === clientId) {
        setSelectedClient({ ...selectedClient, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };
  async function handleDeleteClient(clientId) {
    const confirmDelete = window.confirm("Are you sure you want to delete this client?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientId);

    if (error) {
      console.error("Error deleting client:", error);
      alert("Failed to delete client. Please try again.");
    } else {
      alert("Client deleted successfully!");
      // Optionally refresh your local state
      setClients((prev) => prev.filter((client) => client.id !== clientId));
    }
  }


  const exportToCSV = () => {
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "City",
      "State",
      "Status",
    ];
    const csvData = filteredClients.map((client) => [
      client.first_name,
      client.last_name,
      client.email,
      client.phone,
      client.city,
      client.state,
      client.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clients-query.csv";
    a.click();
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  return (
    <div className="p-6 bg-[#fdfcf3] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#336b6e] mb-2">
            Client Queries
          </h1>
          <p className="text-[#336b6e] opacity-80">
            Manage and track all client inquiries and their onboarding status
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">
                Total Queries
              </h3>
              <User className="w-5 h-5 text-[#336b6e]" />
            </div>
            <p className="text-3xl font-bold text-[#336b6e]">
              {clients.length}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Pending</h3>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">
              {clients.filter((c) => c.status === "pending").length}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Contacted</h3>
              <Mail className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {clients.filter((c) => c.status === "contacted").length}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Onboarded</h3>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600">
              {clients.filter((c) => c.status === "onboarded").length}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#bb9f58] transition-colors duration-200"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#bb9f58] transition-colors duration-200 bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={fetchClients}
                className="px-4 py-3 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors duration-200 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden md:inline">Refresh</span>
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-3 bg-[#bb9f58] text-white rounded-lg hover:bg-[#a08a4a] transition-colors duration-200 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#336b6e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#336b6e] font-medium">Loading clients...</p>
              </div>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-bold text-[#336b6e] mb-2">
                No Clients Found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#fdfcf3] border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort("first_name")}
                          className="flex items-center gap-2 text-sm font-semibold text-[#336b6e] hover:text-[#2a5557] transition-colors"
                        >
                          Name
                          {sortConfig.key === "first_name" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            ))}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort("email")}
                          className="flex items-center gap-2 text-sm font-semibold text-[#336b6e] hover:text-[#2a5557] transition-colors"
                        >
                          Email
                          {sortConfig.key === "email" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            ))}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#336b6e]">
                        Phone
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort("city")}
                          className="flex items-center gap-2 text-sm font-semibold text-[#336b6e] hover:text-[#2a5557] transition-colors"
                        >
                          Location
                          {sortConfig.key === "city" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            ))}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort("status")}
                          className="flex items-center gap-2 text-sm font-semibold text-[#336b6e] hover:text-[#2a5557] transition-colors"
                        >
                          Status
                          {sortConfig.key === "status" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            ))}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#336b6e]">
                        Class Type
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[#336b6e]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentItems.filter((client) => client.status !== "onboarded").map((client) => (
                      <tr
                        key={client.id}
                        className="hover:bg-[#fdfcf3] transition-colors duration-150"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {client.first_name[0]}
                                {client.last_name[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-[#336b6e]">
                                {client.first_name} {client.last_name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={`mailto:${client.email}`}
                            className="text-[#336b6e] hover:text-[#bb9f58] transition-colors"
                          >
                            {client.email}
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={`tel:${client.phone}`}
                            className="text-[#336b6e] hover:text-[#bb9f58] transition-colors"
                          >
                            {client.phone}
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[#336b6e]">
                            {client.city}, {client.state}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(client.status)}
                        </td>
                        <td className="px-6 py-4">
                          {!client.class_type ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                              Not Set
                            </span>
                          ) : client.class_type === 'demo' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              Demo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                              Permanent
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* View button */}
                            <button
                              onClick={() => handleViewClient(client)}
                              className="p-2 text-[#336b6e] hover:bg-[#336b6e] hover:text-white rounded-lg transition-all duration-200"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>

                            {/* Assign Trainer button - For clients without class_type or demo clients */}
                            {(!client.class_type || client.class_type === 'demo') && (
                              <button
                                onClick={() => handleOpenAssignModal(client)}
                                className="p-2 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-200"
                                title="Assign Trainer for Demo Class"
                              >
                                <UserCog className="w-5 h-5" />
                              </button>
                            )}

                            {/* Delete button */}
                            <button
                              onClick={() => handleDeleteClient(client.id)}
                              className="p-2 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200"
                              title="Delete Client"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-[#336b6e]">
                    Showing {indexOfFirstItem + 1} to{" "}
                    {Math.min(indexOfLastItem, filteredClients.length)} of{" "}
                    {filteredClients.length} clients
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-[#fdfcf3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(index + 1)}
                        className={`px-4 py-2 rounded-lg transition-colors ${currentPage === index + 1
                          ? "bg-[#336b6e] text-white"
                          : "border border-gray-200 hover:bg-[#fdfcf3]"
                          }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-[#fdfcf3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Client Detail Modal */}
      {
        showModal && selectedClient && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-6 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Client Details</h2>
                  <p className="text-white/80">Complete information and status</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Status Update */}
                <div className="bg-[#fdfcf3] rounded-xl p-4">
                  <label className="block text-sm font-semibold text-[#336b6e] mb-2">
                    Update Status
                  </label>
                  <select
                    value={selectedClient.status}
                    onChange={(e) =>
                      handleStatusChange(selectedClient.id, e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#bb9f58] bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="onboarded">Onboarded</option>
                  </select>
                </div>

                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-bold text-[#336b6e] mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">
                        First Name
                      </label>
                      <p className="font-semibold text-[#336b6e]">
                        {selectedClient.first_name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">
                        Last Name
                      </label>
                      <p className="font-semibold text-[#336b6e]">
                        {selectedClient.last_name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-bold text-[#336b6e] mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">
                        Email Address
                      </label>
                      <a
                        href={`mailto:${selectedClient.email}`}
                        className="font-semibold text-[#bb9f58] hover:underline"
                      >
                        {selectedClient.email}
                      </a>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">
                        Phone Number
                      </label>
                      <a
                        href={`tel:${selectedClient.phone}`}
                        className="font-semibold text-[#bb9f58] hover:underline"
                      >
                        {selectedClient.phone}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h3 className="text-lg font-bold text-[#336b6e] mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Address Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">
                        Street Address
                      </label>
                      <p className="font-semibold text-[#336b6e]">
                        {selectedClient.street}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">
                          City
                        </label>
                        <p className="font-semibold text-[#336b6e]">
                          {selectedClient.city}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">
                          State
                        </label>
                        <p className="font-semibold text-[#336b6e]">
                          {selectedClient.state}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">
                          Pincode
                        </label>
                        <p className="font-semibold text-[#336b6e]">
                          {selectedClient.pincode}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">
                          Country
                        </label>
                        <p className="font-semibold text-[#336b6e]">
                          {selectedClient.country}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div>
                  <h3 className="text-lg font-bold text-[#336b6e] mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Query Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">
                        Current Status
                      </label>
                      <div>{getStatusBadge(selectedClient.status)}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">
                        Submitted On
                      </label>
                      <p className="font-semibold text-[#336b6e]">
                        {new Date(selectedClient.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 p-6 border-t border-gray-200 flex items-center justify-between gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-semibold"
                >
                  Close
                </button>
                <div className="flex gap-2 flex-1">
                  <a
                    href={`mailto:${selectedClient.email}`}
                    className="flex-1 px-6 py-3 bg-[#bb9f58] text-white rounded-lg hover:bg-[#a08a4a] transition-colors duration-200 font-semibold flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                  <a
                    href={`tel:${selectedClient.phone}`}
                    className="flex-1 px-6 py-3 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors duration-200 font-semibold flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Assign Trainer Modal */}
      {
        showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Assign Trainer for Demo Class</h2>
                    <p className="text-white/80 mt-1">
                      For {selectedClientForAssign?.first_name} {selectedClientForAssign?.last_name}
                    </p>
                    <p className="text-white/60 text-sm mt-1">
                      This will set class type to 'Demo' and onboard the client
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search trainers by name, email, or city..."
                      value={trainerSearchTerm}
                      onChange={(e) => setTrainerSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58] transition-colors"
                    />
                  </div>
                </div>

                {/* Trainers List */}
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredTrainers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <UserCog className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No trainers found</p>
                    </div>
                  ) : (
                    filteredTrainers.map((trainer) => (
                      <div
                        key={trainer.id}
                        onClick={() => setSelectedTrainer(trainer)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedTrainer?.id === trainer.id
                          ? 'border-[#bb9f58] bg-[#fdfcf3]'
                          : 'border-gray-200 hover:border-[#336b6e] hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-lg">
                              {trainer.first_name?.[0]}{trainer.last_name?.[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-[#336b6e] truncate">
                              {trainer.first_name} {trainer.last_name}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">{trainer.email}</p>
                            <p className="text-xs text-gray-500">
                              {trainer.city}, {trainer.state} • {trainer.experience} experience
                            </p>
                          </div>
                          {selectedTrainer?.id === trainer.id && (
                            <CheckCircle className="w-6 h-6 text-[#bb9f58] flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignTrainer}
                  disabled={!selectedTrainer || isAssigning}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#336b6e] to-[#2a5557] text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  {isAssigning ? 'Assigning...' : 'Assign for Demo Class'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
}

export default ClientsQueryPage;
