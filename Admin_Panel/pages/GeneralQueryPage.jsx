import React, { useState, useEffect } from "react";
import {
    Search,
    Eye,
    Trash2,
    RefreshCw,
    ChevronUp,
    ChevronDown,
    AlertCircle,
    Users,
    CheckCircle,
    Clock,
    X,
    UserCog,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Mail,
    Phone,
    MessageSquare,
    Calendar
} from "lucide-react";
import supabase from "../../src/supabase/supabse";
import { useNavigate } from "react-router-dom";
import { sendClientAssignmentNotification } from "../../src/utils/emailService";

function GeneralQueryPage() {
    const navigate = useNavigate();
    const [queries, setQueries] = useState([]);
    const [filteredQueries, setFilteredQueries] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Trainer assignment modal
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [allTrainers, setAllTrainers] = useState([]);
    const [filteredTrainers, setFilteredTrainers] = useState([]);
    const [trainerSearchTerm, setTrainerSearchTerm] = useState("");
    const [selectedTrainer, setSelectedTrainer] = useState(null);
    const [isAssigning, setIsAssigning] = useState(false);

    // View query modal
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedQueryForView, setSelectedQueryForView] = useState(null);

    useEffect(() => {
        fetchQueries();
        fetchAllTrainers();
    }, []);

    useEffect(() => {
        filterAndSortQueries();
    }, [searchTerm, statusFilter, sortConfig, queries]);

    useEffect(() => {
        if (trainerSearchTerm.trim() === "") {
            setFilteredTrainers(allTrainers);
        } else {
            const filtered = allTrainers.filter(trainer =>
                `${trainer.first_name} ${trainer.last_name}`.toLowerCase().includes(trainerSearchTerm.toLowerCase()) ||
                trainer.email.toLowerCase().includes(trainerSearchTerm.toLowerCase()) ||
                trainer.city?.toLowerCase().includes(trainerSearchTerm.toLowerCase())
            );
            setFilteredTrainers(filtered);
        }
    }, [trainerSearchTerm, allTrainers]);

    const fetchQueries = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("booking_queries")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setQueries(data || []);
        } catch (error) {
            console.error("Error fetching queries:", error);
            alert("Failed to fetch queries: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const filterAndSortQueries = () => {
        let result = [...queries];

        // Search filter
        if (searchTerm) {
            result = result.filter(q =>
                q.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.phone?.includes(searchTerm) ||
                q.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.service_title?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            result = result.filter(q => q.status === statusFilter);
        }

        // Sorting
        if (sortConfig.key) {
            result.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
        }

        setFilteredQueries(result);
        setCurrentPage(1);
    };

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const handleDeleteQuery = async (queryId) => {
        if (!confirm("Are you sure you want to delete this query?")) return;

        try {
            const { error } = await supabase
                .from("booking_queries")
                .delete()
                .eq("id", queryId);

            if (error) throw error;
            alert("Query deleted successfully!");
            fetchQueries();
        } catch (error) {
            console.error("Error deleting query:", error);
            alert("Failed to delete query: " + error.message);
        }
    };

    const fetchAllTrainers = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_PROJECT_URL}/functions/v1/get-all-users`, {
                headers: {
                    'Authorization': `Bearer ${import.meta.env.VITE_ANON_KEY}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch users');
            const users = await response.json();

            const trainerUsers = users.filter(user => user.user_metadata?.role === 'trainer');

            const { data: trainerProfiles, error } = await supabase
                .from('trainer_profiles')
                .select('*')
                .in('user_id', trainerUsers.map(u => u.id));

            if (error) throw error;

            const mergedTrainers = trainerUsers.map(user => {
                const profile = trainerProfiles?.find(p => p.user_id === user.id);
                const metadata = user.user_metadata || {};

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
                };
            });

            const activeTrainers = mergedTrainers.filter(t => t.is_active && t.kyc_status === 'approved');
            setAllTrainers(activeTrainers);
            setFilteredTrainers(activeTrainers);
        } catch (error) {
            console.error('Error fetching trainers:', error);
        }
    };

    const handleOpenAssignModal = (query) => {
        setSelectedQuery(query);
        setSelectedTrainer(null);
        setTrainerSearchTerm("");
        setShowAssignModal(true);
    };

    const handleOpenViewModal = (query) => {
        setSelectedQueryForView(query);
        setShowViewModal(true);
    };

    const handleMoveToDemo = async () => {
        if (!selectedTrainer) {
            alert('Please select a trainer');
            return;
        }

        setIsAssigning(true);
        try {
            // 1. Insert into clients table
            const { data: newClient, error: clientError } = await supabase
                .from('clients')
                .insert([{
                    first_name: selectedQuery.first_name,
                    last_name: selectedQuery.last_name,
                    email: selectedQuery.email,
                    phone: selectedQuery.phone,
                    status: 'accepted',
                    class_type: 'demo',
                    trainer_id: selectedTrainer.id
                }])
                .select()
                .single();

            if (clientError) throw clientError;

            // 2. Update booking_queries status
            const { error: queryError } = await supabase
                .from('booking_queries')
                .update({ status: 'converted' })
                .eq('id', selectedQuery.id);

            if (queryError) throw queryError;

            // 3. Create notification for trainer
            const { error: notifError } = await supabase
                .from('notifications')
                .insert({
                    user_id: selectedTrainer.user_id,
                    type: 'client_assigned',
                    title: 'New Demo Client Assigned',
                    message: `${selectedQuery.first_name} ${selectedQuery.last_name} has been assigned to you for a demo class from general queries.`,
                    client_id: newClient.id,
                    client_type: 'demo'
                });

            if (notifError) console.error('Error creating notification:', notifError);

            // 4. Send email notification to trainer
            try {
                await sendClientAssignmentNotification(selectedTrainer.email, {
                    clientName: `${selectedQuery.first_name} ${selectedQuery.last_name}`,
                    clientEmail: selectedQuery.email,
                    clientPhone: selectedQuery.phone,
                    classType: 'demo',
                    assignedDate: new Date().toISOString()
                });
            } catch (emailError) {
                console.error('Error sending trainer email:', emailError);
            }

            alert('Query successfully moved to Demo Clients and trainer assigned!');
            setShowAssignModal(false);
            setSelectedQuery(null);
            setSelectedTrainer(null);
            fetchQueries();
        } catch (error) {
            console.error('Error moving to demo:', error);
            alert('Failed to move to demo: ' + error.message);
        } finally {
            setIsAssigning(false);
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pending' },
            converted: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Converted' },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: X, label: 'Rejected' }
        };
        const { bg, text, icon: Icon, label } = config[status] || config.pending;
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
                <Icon className="w-3 h-3" />
                {label}
            </span>
        );
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredQueries.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredQueries.length / itemsPerPage);

    return (
        <div className="p-6 bg-[#fdfcf3] min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[#336b6e] mb-2">General Queries</h1>
                    <p className="text-[#336b6e] opacity-80">
                        Manage inquiries from the booking modal and move them to demo classes
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-600 text-sm font-medium">Total Queries</h3>
                            <Users className="w-5 h-5 text-[#336b6e]" />
                        </div>
                        <p className="text-3xl font-bold text-[#336b6e]">{queries.length}</p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-600 text-sm font-medium">Pending</h3>
                            <Clock className="w-5 h-5 text-yellow-500" />
                        </div>
                        <p className="text-3xl font-bold text-yellow-600">
                            {queries.filter(q => q.status === 'pending').length}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-600 text-sm font-medium">Converted</h3>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-3xl font-bold text-green-600">
                            {queries.filter(q => q.status === 'converted').length}
                        </p>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, service, or message..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#bb9f58] transition-colors"
                                />
                            </div>
                        </div>

                        <div className="md:w-48">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#bb9f58] transition-colors bg-white"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="converted">Converted</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        <button
                            onClick={fetchQueries}
                            className="px-4 py-3 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span className="hidden md:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-[#336b6e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-[#336b6e] font-medium">Loading queries...</p>
                            </div>
                        </div>
                    ) : currentItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
                            <h3 className="text-xl font-bold text-[#336b6e] mb-2">No Queries Found</h3>
                            <p className="text-gray-500">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[#fdfcf3] border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left">
                                                <button onClick={() => handleSort('first_name')} className="flex items-center gap-2 text-sm font-semibold text-[#336b6e]">
                                                    Name
                                                    {sortConfig.key === 'first_name' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                                                </button>
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#336b6e]">Contact</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#336b6e]">Service</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#336b6e]">Status</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-[#336b6e]">Date</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-[#336b6e]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {currentItems.map((query) => (
                                            <tr key={query.id} className="hover:bg-[#fdfcf3] transition-colors">
                                                <td className="px-6 py-4 font-semibold text-[#336b6e]">
                                                    {query.first_name} {query.last_name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <div className="flex items-center gap-1 text-[#336b6e]"><Mail className="w-3 h-3" /> {query.email}</div>
                                                        <div className="flex items-center gap-1 text-gray-500"><Phone className="w-3 h-3" /> {query.phone}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-[#336b6e] font-medium">
                                                    {query.service_title}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(query.status)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(query.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleOpenViewModal(query)}
                                                            className="p-2 text-[#336b6e] hover:bg-[#336b6e] hover:text-white rounded-lg transition-all"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                        {query.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleOpenAssignModal(query)}
                                                                className="p-2 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                                                                title="Move to Demo"
                                                            >
                                                                <TrendingUp className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteQuery(query.id)}
                                                            className="p-2 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                                                            title="Delete Query"
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
                                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredQueries.length)} of {filteredQueries.length}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 transition-colors"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 transition-colors"
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

            {/* Assign Trainer Modal (Move to Demo) */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Move to Demo & Assign Trainer</h2>
                                    <p className="text-white/80 mt-1">
                                        For {selectedQuery?.first_name} {selectedQuery?.last_name}
                                    </p>
                                </div>
                                <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search trainers..."
                                        value={trainerSearchTerm}
                                        onChange={(e) => setTrainerSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58]"
                                    />
                                </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {filteredTrainers.map((trainer) => (
                                    <div
                                        key={trainer.id}
                                        onClick={() => setSelectedTrainer(trainer)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedTrainer?.id === trainer.id ? 'border-[#bb9f58] bg-[#fdfcf3]' : 'border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                                                {trainer.first_name[0]}{trainer.last_name[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-[#336b6e] truncate">{trainer.first_name} {trainer.last_name}</h3>
                                                <p className="text-sm text-gray-600 truncate">{trainer.email}</p>
                                                <p className="text-xs text-gray-500">{trainer.city}, {trainer.state}</p>
                                            </div>
                                            {selectedTrainer?.id === trainer.id && <CheckCircle className="w-6 h-6 text-[#bb9f58]" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
                            <button onClick={() => setShowAssignModal(false)} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium">
                                Cancel
                            </button>
                            <button
                                onClick={handleMoveToDemo}
                                disabled={!selectedTrainer || isAssigning}
                                className="px-6 py-2.5 bg-gradient-to-r from-[#336b6e] to-[#2a5557] text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                            >
                                {isAssigning ? 'Moving...' : 'Move to Demo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Query Modal */}
            {showViewModal && selectedQueryForView && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-white/20">
                        {/* Modal Header */}
                        <div className="bg-[#336b6e] p-6 text-white relative">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/10 rounded-lg">
                                        <MessageSquare className="w-6 h-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight">Query Details</h2>
                                </div>
                                <button
                                    onClick={() => setShowViewModal(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-all group"
                                >
                                    <X className="w-6 h-6 text-white/70 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
                            {/* Top Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block px-1">Customer Name</label>
                                    <div className="flex items-center gap-4 bg-[#fdfcf3] p-4 rounded-2xl border border-[#336b6e]/5 group hover:border-[#336b6e]/20 transition-all">
                                        <div className="w-12 h-12 bg-[#336b6e] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#336b6e]/20">
                                            <UserCog className="w-6 h-6" />
                                        </div>
                                        <div className="font-bold text-[#336b6e] text-xl">
                                            {selectedQueryForView.first_name} {selectedQueryForView.last_name}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block px-1">Service Requested</label>
                                    <div className="flex items-center gap-4 bg-[#fdfcf3] p-4 rounded-2xl border border-gray-100 group hover:border-[#bb9f58]/20 transition-all">
                                        <div className="w-12 h-12 bg-[#bb9f58] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#bb9f58]/20">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                        <div className="font-bold text-[#336b6e] text-lg">
                                            {selectedQueryForView.service_title}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Message Section */}
                            <div className="mb-10 space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block px-1">Inquiry Message</label>
                                <div className="bg-[#fdfcf3] p-6 rounded-2xl border border-gray-100 relative group">
                                    <div className="absolute top-4 left-4 text-[#336b6e]/10">
                                        <MessageSquare className="w-8 h-8 fill-current" />
                                    </div>
                                    <div className="relative pl-8 text-gray-700 leading-relaxed text-lg italic">
                                        "{selectedQueryForView.message}"
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 pt-6 border-t border-gray-100">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Email Address</label>
                                            <div className="font-semibold text-[#336b6e] break-all">{selectedQueryForView.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Phone Number</label>
                                            <div className="font-semibold text-[#336b6e]">{selectedQueryForView.phone}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Preferred Date</label>
                                            <div className="font-semibold text-[#336b6e]">
                                                {selectedQueryForView.preferred_date ? new Date(selectedQueryForView.preferred_date).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Flexible / Not Specified'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Received On</label>
                                            <div className="font-semibold text-[#336b6e]">
                                                {new Date(selectedQueryForView.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-gray-100">
                                <div className="flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-2xl w-full md:w-auto">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</label>
                                    <div className="scale-110">
                                        {getStatusBadge(selectedQueryForView.status)}
                                    </div>
                                </div>
                                <div className="flex gap-3 w-full md:w-auto">
                                    <button
                                        onClick={() => handleDeleteQuery(selectedQueryForView.id)}
                                        className="flex-1 md:flex-none px-6 py-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 active:scale-95 transition-all font-bold flex items-center justify-center gap-2 group border border-red-100"
                                    >
                                        <Trash2 className="w-5 h-5 transition-transform group-hover:rotate-12" />
                                        Delete
                                    </button>
                                    {selectedQueryForView.status === 'pending' && (
                                        <button
                                            onClick={() => {
                                                setShowViewModal(false);
                                                handleOpenAssignModal(selectedQueryForView);
                                            }}
                                            className="flex-1 md:flex-none px-8 py-4 bg-[#336b6e] text-white rounded-2xl hover:bg-[#2a5557] active:scale-95 transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#336b6e]/20 group"
                                        >
                                            <TrendingUp className="w-5 h-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                                            Move to Demo
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GeneralQueryPage;
