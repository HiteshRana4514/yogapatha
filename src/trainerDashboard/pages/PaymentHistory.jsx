import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  DollarSign, 
  Calendar, 
  Download, 
  Filter, 
  Search,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Eye,
  Loader2,
  X as XIcon
} from 'lucide-react';
import supabase from '../../supabase/supabse';
import { jsPDF } from 'jspdf';

/**
 * Payment History Page for Trainers
 * Shows all payment transactions recorded by admin for the trainer's clients
 */
const PaymentHistory = () => {
  const { userData } = useOutletContext();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, this_month, last_month, this_year
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [invoiceSettings, setInvoiceSettings] = useState(null);

  useEffect(() => {
    if (userData) {
      fetchPaymentHistory();
      fetchInvoiceSettings();
    }
  }, [userData]);

  useEffect(() => {
    filterPayments();
  }, [searchTerm, statusFilter, dateFilter, payments]);

  const fetchInvoiceSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('invoice_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setInvoiceSettings(data);
      }
    } catch (error) {
      console.error('Error fetching invoice settings:', error);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);

      // Get trainer profile
      const { data: trainerProfile, error: profileError } = await supabase
        .from('trainer_profiles')
        .select('id')
        .eq('user_id', userData.id)
        .single();

      if (profileError) throw profileError;

      // Fetch payment transactions for this trainer
      const { data, error } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          clients:client_id (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('trainer_id', trainerProfile.id)
        .order('payment_date', { ascending: false });

      if (error) throw error;

      setPayments(data || []);
    } catch (err) {
      console.error('Error fetching payment history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let result = [...payments];

    // Search filter
    if (searchTerm) {
      result = result.filter(payment =>
        payment.clients?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.clients?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.transaction_reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(payment => payment.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      result = result.filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        const paymentMonth = paymentDate.getMonth();
        const paymentYear = paymentDate.getFullYear();

        if (dateFilter === 'this_month') {
          return paymentMonth === currentMonth && paymentYear === currentYear;
        } else if (dateFilter === 'last_month') {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return paymentMonth === lastMonth && paymentYear === lastMonthYear;
        } else if (dateFilter === 'this_year') {
          return paymentYear === currentYear;
        }
        return true;
      });
    }

    setFilteredPayments(result);
  };

  const getTotalEarnings = () => {
    return filteredPayments.reduce((sum, payment) => {
      if (payment.status === 'completed') {
        return sum + parseFloat(payment.amount || 0);
      }
      return sum;
    }, 0);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle,
        text: 'Completed'
      },
      pending: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Clock,
        text: 'Pending'
      },
      failed: {
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: XCircle,
        text: 'Failed'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailModal(true);
  };

  const handleViewProof = (payment) => {
    setSelectedPayment(payment);
    setShowProofModal(true);
  };

  // Generate and download invoice PDF
  const downloadInvoice = async (payment) => {
    const amountReceived = payment.trainer_amount || payment.amount || 0;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (2 * margin);
    
    const companyName = invoiceSettings?.company_name || 'YogaPatha';
    const companyTagline = invoiceSettings?.company_tagline || 'Professional Yoga Training Platform';
    const companyEmail = invoiceSettings?.email || 'support@yogapatha.com';
    const companyPhone = invoiceSettings?.phone || '+91 XXX XXX XXXX';
    const companyAddress = invoiceSettings?.address || 'Your Company Address Here';
    const invoicePrefix = invoiceSettings?.invoice_prefix || 'YP';
    const footerText = invoiceSettings?.footer_text || 'Thank you for being part of YogaPatha!';
    const termsText = invoiceSettings?.terms_text || 'This is a computer-generated invoice and does not require a signature.';
    
    const parsePrimaryColor = () => {
      if (invoiceSettings?.primary_color) {
        const rgb = invoiceSettings.primary_color.split(',').map(v => parseInt(v.trim()));
        if (rgb.length === 3) return rgb;
      }
      return [51, 107, 110];
    };
    
    const primaryColor = parsePrimaryColor();
    const greenColor = [5, 150, 105];
    const redColor = [220, 38, 38];
    const grayColor = [102, 102, 102];
    
    let yPos = 0;
    
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    if (invoiceSettings?.company_logo_url) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = invoiceSettings.company_logo_url;
        
        await new Promise((resolve) => {
          img.onload = () => {
            try {
              doc.addImage(img, 'PNG', margin, 8, 25, 25);
              resolve();
            } catch (err) {
              resolve();
            }
          };
          img.onerror = () => resolve();
          setTimeout(() => resolve(), 3000);
        });
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    }
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(companyTagline, pageWidth / 2, 22, { align: 'center' });
    doc.text(`Email: ${companyEmail} | Phone: ${companyPhone}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(companyAddress, pageWidth / 2, 34, { align: 'center' });
    
    yPos = 50;
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT INVOICE', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 12;
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    const addRow = (label, value, isBold = false) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(label, margin, yPos);
      
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(0, 0, 0);
      const valueText = String(value);
      doc.text(valueText, pageWidth - margin, yPos, { align: 'right', maxWidth: contentWidth * 0.6 });
      
      doc.setDrawColor(238, 238, 238);
      doc.setLineWidth(0.1);
      doc.line(margin, yPos + 1.5, pageWidth - margin, yPos + 1.5);
      yPos += 8;
    };
    
    addRow('Invoice Number:', `${invoicePrefix}-${payment.id.substring(0, 8).toUpperCase()}`);
    addRow('Payment Date:', new Date(payment.payment_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }));
    addRow('Client Name:', `${payment.clients?.first_name} ${payment.clients?.last_name}`);
    addRow('Payment Method:', payment.payment_method?.replace('_', ' ').toUpperCase());
    
    if (payment.transaction_reference) {
      addRow('Transaction Reference:', payment.transaction_reference);
    }
    
    if (payment.payment_period_start && payment.payment_period_end) {
      const periodText = `${new Date(payment.payment_period_start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${new Date(payment.payment_period_end).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      addRow('Payment Period:', periodText);
    }
    
    addRow('Status:', payment.status.toUpperCase(), true);
    
    yPos += 5;
    
    const boxHeight = payment.total_fee && payment.platform_fee ? 60 : 35;
    doc.setFillColor(240, 249, 255);
    doc.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, 'F');
    
    yPos += 12;
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Rs ${amountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 7;
    doc.setFontSize(9);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('Amount Received', pageWidth / 2, yPos, { align: 'center' });
    
    if (payment.total_fee && payment.platform_fee) {
      yPos += 10;
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      
      const leftX = margin + 10;
      const rightX = pageWidth - margin - 10;
      
      doc.setFont('helvetica', 'normal');
      doc.text('Total Fee (Client Paid):', leftX, yPos);
      doc.text(`Rs ${payment.total_fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, rightX, yPos, { align: 'right' });
      yPos += 6;
      
      doc.setTextColor(redColor[0], redColor[1], redColor[2]);
      doc.text(`Platform Fee (${payment.platform_fee_percentage}%):`, leftX, yPos);
      doc.text(`- Rs ${payment.platform_fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, rightX, yPos, { align: 'right' });
      yPos += 8;
      
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.3);
      doc.line(leftX, yPos, rightX, yPos);
      yPos += 5;
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
      doc.text('Your Income:', leftX, yPos);
      doc.text(`Rs ${amountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, rightX, yPos, { align: 'right' });
      yPos += 8;
    } else {
      yPos += boxHeight - 19;
    }
    
    if (payment.admin_notes) {
      yPos += 8;
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(1);
      
      const noteLines = doc.splitTextToSize(payment.admin_notes, contentWidth - 10);
      const noteHeight = (noteLines.length * 5) + 12;
      
      doc.rect(margin, yPos, contentWidth, noteHeight);
      doc.line(margin, yPos, margin, yPos + noteHeight);
      
      yPos += 7;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Admin Notes:', margin + 5, yPos);
      
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(noteLines, margin + 5, yPos);
      yPos += noteHeight - 7;
    }
    
    const footerY = pageHeight - 20;
    doc.setDrawColor(238, 238, 238);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(footerText, pageWidth / 2, footerY + 5, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(termsText, pageWidth / 2, footerY + 9, { align: 'center' });
    doc.text(`For any queries, please contact us at ${companyEmail}`, pageWidth / 2, footerY + 13, { align: 'center' });
    
    doc.save(`${companyName}_Invoice_${invoicePrefix}-${payment.id.substring(0, 8)}.pdf`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <DollarSign className="w-8 h-8" />
          Payment History
        </h1>
        <p className="text-lg text-white/80">
          View all payments received from clients
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Payments</span>
            <FileText className="w-5 h-5 text-[#336b6e]" />
          </div>
          <p className="text-3xl font-bold text-[#336b6e]">{filteredPayments.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Earnings</span>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(getTotalEarnings())}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Completed</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-[#336b6e]">
            {filteredPayments.filter(p => p.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by client or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bb9f58]"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bb9f58] appearance-none"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bb9f58] appearance-none"
            >
              <option value="all">All Time</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#336b6e] animate-spin" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No payment records found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Payments will appear here once admin records them'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(payment.payment_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-[#336b6e]">
                          {payment.clients?.first_name} {payment.clients?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{payment.clients?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(payment.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 capitalize">
                        {payment.payment_method?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(payment)}
                          className="flex items-center gap-1 text-[#bb9f58] hover:text-[#a08a4a] font-medium text-sm transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        {payment.payment_proof_url && (
                          <button
                            onClick={() => handleViewProof(payment)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Payment Proof"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => downloadInvoice(payment)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Download Invoice"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Payment Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Client Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Client Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-lg font-bold text-[#336b6e]">
                    {selectedPayment.clients?.first_name} {selectedPayment.clients?.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{selectedPayment.clients?.email}</p>
                  <p className="text-sm text-gray-600">{selectedPayment.clients?.phone}</p>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Amount</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(selectedPayment.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    {getStatusBadge(selectedPayment.status)}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Payment Date</p>
                    <p className="font-semibold text-[#336b6e]">
                      {formatDate(selectedPayment.payment_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                    <p className="font-semibold text-[#336b6e] capitalize">
                      {selectedPayment.payment_method?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transaction Reference */}
              {selectedPayment.transaction_reference && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Transaction Reference</p>
                  <p className="font-mono text-sm bg-gray-50 p-3 rounded-lg">
                    {selectedPayment.transaction_reference}
                  </p>
                </div>
              )}

              {/* Payment Period */}
              {(selectedPayment.payment_period_start || selectedPayment.payment_period_end) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Payment Period</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      {selectedPayment.payment_period_start && formatDate(selectedPayment.payment_period_start)}
                      {selectedPayment.payment_period_start && selectedPayment.payment_period_end && ' - '}
                      {selectedPayment.payment_period_end && formatDate(selectedPayment.payment_period_end)}
                    </p>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedPayment.admin_notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Admin Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{selectedPayment.admin_notes}</p>
                  </div>
                </div>
              )}

              {/* Payment Proof */}
              {selectedPayment.payment_proof_url && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Payment Proof</h3>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleViewProof(selectedPayment);
                    }}
                    className="flex items-center gap-2 text-[#bb9f58] hover:text-[#a08a4a] font-medium transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Payment Proof
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
              <div className="flex gap-3">
                <button
                  onClick={() => downloadInvoice(selectedPayment)}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Invoice
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-6 py-3 bg-[#336b6e] text-white rounded-lg font-semibold hover:bg-[#2a5557] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Proof Modal */}
      {showProofModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowProofModal(false)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Payment Proof
                </h2>
                <p className="text-sm text-white/80 mt-1">
                  Payment Date: {new Date(selectedPayment.payment_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setShowProofModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Payment Details */}
              <div className="mb-6 p-4 bg-[#fdfcf3] rounded-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Amount Received</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(selectedPayment.trainer_amount || selectedPayment.amount || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="text-lg font-semibold text-[#336b6e] capitalize">
                      {selectedPayment.payment_method?.replace('_', ' ')}
                    </p>
                  </div>
                  {selectedPayment.transaction_reference && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Transaction Reference</p>
                      <p className="text-lg font-semibold text-[#336b6e] font-mono">
                        {selectedPayment.transaction_reference}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Proof Image/Document */}
              {selectedPayment.payment_proof_url && (
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-[#336b6e] mb-3">Uploaded Proof</h3>
                  {selectedPayment.payment_proof_url.toLowerCase().endsWith('.pdf') ? (
                    <div className="border-2 border-gray-200 rounded-xl p-4 text-center">
                      <FileText className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-600 mb-4">PDF Document</p>
                      <a
                        href={selectedPayment.payment_proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors"
                      >
                        <Download className="w-5 h-5" />
                        Open PDF
                      </a>
                    </div>
                  ) : (
                    <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                      <img
                        src={selectedPayment.payment_proof_url}
                        alt="Payment Proof"
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Admin Notes */}
              {selectedPayment.admin_notes && (
                <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Admin Notes:</p>
                  <p className="text-gray-700">{selectedPayment.admin_notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
              <button
                onClick={() => setShowProofModal(false)}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={() => downloadInvoice(selectedPayment)}
                className="px-6 py-2 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors font-medium flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
