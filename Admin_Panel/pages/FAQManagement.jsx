import React, { useState, useEffect } from 'react'
import {
    Plus,
    Edit2,
    Trash2,
    Search,
    X,
    Eye,
    EyeOff,
    ArrowUp,
    ArrowDown,
    HelpCircle
} from 'lucide-react'
import supabase from '../../src/supabase/supabse'

function FAQManagement() {
    const [faqs, setFaqs] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingFaq, setEditingFaq] = useState(null)

    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        display_order: 0,
        status: 'active'
    })

    useEffect(() => {
        fetchFaqs()
    }, [])

    const fetchFaqs = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('faqs')
                .select('*')
                .order('display_order', { ascending: true })

            if (error) throw error
            setFaqs(data || [])
        } catch (error) {
            console.error('Error fetching FAQs:', error)
            alert('Failed to fetch FAQs: ' + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 'active' : 'inactive') : value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.question || !formData.answer) {
            alert('Please fill in all required fields')
            return
        }

        try {
            if (editingFaq) {
                const { error } = await supabase
                    .from('faqs')
                    .update(formData)
                    .eq('id', editingFaq.id)

                if (error) throw error
                alert('FAQ updated successfully!')
            } else {
                const { error } = await supabase
                    .from('faqs')
                    .insert([formData])

                if (error) throw error
                alert('FAQ created successfully!')
            }

            fetchFaqs()
            closeModal()
        } catch (error) {
            console.error('Error saving FAQ:', error)
            alert('Failed to save FAQ: ' + error.message)
        }
    }

    const handleEdit = (faq) => {
        setEditingFaq(faq)
        setFormData({
            question: faq.question,
            answer: faq.answer,
            display_order: faq.display_order,
            status: faq.status
        })
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this FAQ?')) return

        try {
            const { error } = await supabase
                .from('faqs')
                .delete()
                .eq('id', id)

            if (error) throw error
            alert('FAQ deleted successfully!')
            fetchFaqs()
        } catch (error) {
            console.error('Error deleting FAQ:', error)
            alert('Failed to delete FAQ: ' + error.message)
        }
    }

    const toggleStatus = async (faq) => {
        try {
            const newStatus = faq.status === 'active' ? 'inactive' : 'active'
            const { error } = await supabase
                .from('faqs')
                .update({ status: newStatus })
                .eq('id', faq.id)

            if (error) throw error
            fetchFaqs()
        } catch (error) {
            console.error('Error toggling status:', error)
            alert('Failed to update status: ' + error.message)
        }
    }

    const updateDisplayOrder = async (id, newOrder) => {
        try {
            const { error } = await supabase
                .from('faqs')
                .update({ display_order: newOrder })
                .eq('id', id)

            if (error) throw error
            fetchFaqs()
        } catch (error) {
            console.error('Error updating order:', error)
            alert('Failed to update order: ' + error.message)
        }
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingFaq(null)
        setFormData({
            question: '',
            answer: '',
            display_order: 0,
            status: 'active'
        })
    }

    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-4 md:p-6 bg-[#fdfcf3] min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-[#336b6e] mb-2">FAQ Management</h1>
                    <p className="text-gray-600">Manage frequently asked questions for the landing page</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search FAQs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                            />
                        </div>

                        <button
                            onClick={() => setShowModal(true)}
                            className="w-full md:w-auto px-6 py-2 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Add FAQ
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-16 h-16 border-4 border-[#336b6e] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredFaqs.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No FAQs found</h3>
                        <p className="text-gray-500">Start by adding your first FAQ</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredFaqs.map((faq) => (
                            <div
                                key={faq.id}
                                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden"
                            >
                                <div className="p-4 border-b border-gray-100 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-[#336b6e]">{faq.question}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${faq.status === 'active'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {faq.status}
                                            </span>
                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                                Order: {faq.display_order}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <p className="text-gray-600 text-sm mb-4">
                                        {faq.answer}
                                    </p>

                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            onClick={() => toggleStatus(faq)}
                                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2 text-sm"
                                            title={faq.status === 'active' ? 'Deactivate' : 'Activate'}
                                        >
                                            {faq.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => updateDisplayOrder(faq.id, faq.display_order - 1)}
                                            className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                                            title="Move up"
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => updateDisplayOrder(faq.id, faq.display_order + 1)}
                                            className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                                            title="Move down"
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleEdit(faq)}
                                            className="px-3 py-2 bg-[#336b6e] hover:bg-[#2a5557] text-white rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(faq.id)}
                                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-gradient-to-r from-[#336b6e] to-[#2a5557] text-white p-6 flex items-center justify-between">
                                <h2 className="text-2xl font-bold">
                                    {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
                                </h2>
                                <button onClick={closeModal} className="text-white hover:text-gray-200 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Question <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="question"
                                        value={formData.question}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                        placeholder="Enter the question"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Answer <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="answer"
                                        value={formData.answer}
                                        onChange={handleInputChange}
                                        required
                                        rows="6"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                        placeholder="Enter the answer..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Display Order
                                    </label>
                                    <input
                                        type="number"
                                        name="display_order"
                                        value={formData.display_order}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                                        placeholder="0"
                                    />
                                </div>

                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="status"
                                            checked={formData.status === 'active'}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 text-[#336b6e] rounded focus:ring-[#336b6e]"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Active</span>
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors font-medium"
                                    >
                                        {editingFaq ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default FAQManagement
