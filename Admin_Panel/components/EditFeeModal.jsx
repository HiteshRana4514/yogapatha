import React, { useState, useEffect } from 'react'
import { X, DollarSign, Save } from 'lucide-react'
import supabase from '../../src/supabase/supabse'

function EditFeeModal({ isOpen, onClose, client, onUpdate }) {
    const [formData, setFormData] = useState({
        total_fee: '',
        platform_fee_percentage: '',
        fee_frequency: 'monthly',
        trainer_income: ''
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (isOpen && client) {
            setFormData({
                total_fee: client.fee_amount || '',
                platform_fee_percentage: client.platform_fee_percentage || '',
                fee_frequency: client.fee_frequency || 'monthly',
                trainer_income: calculateIncome(client.fee_amount, client.platform_fee_percentage)
            })
        }
    }, [isOpen, client])

    const calculateIncome = (total, percentage) => {
        const t = parseFloat(total) || 0
        const p = parseFloat(percentage) || 0
        if (t > 0 && p >= 0) {
            return (t - (t * p / 100)).toFixed(2)
        }
        return ''
    }

    const handleChange = (field, value) => {
        const newData = { ...formData, [field]: value }

        if (field === 'total_fee' || field === 'platform_fee_percentage') {
            newData.trainer_income = calculateIncome(
                field === 'total_fee' ? value : formData.total_fee,
                field === 'platform_fee_percentage' ? value : formData.platform_fee_percentage
            )
        }

        setFormData(newData)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)

        try {
            const { error } = await supabase
                .from('clients')
                .update({
                    fee_amount: parseFloat(formData.total_fee), // Note: DB column is fee_amount, but we use total_fee in UI state
                    total_fee: parseFloat(formData.total_fee), // Updating both for consistency if schema varies
                    platform_fee_percentage: parseFloat(formData.platform_fee_percentage),
                    fee_frequency: formData.fee_frequency
                })
                .eq('id', client.id)

            if (error) throw error

            onUpdate()
            onClose()
            alert('Fee details updated successfully!')
        } catch (error) {
            console.error('Error updating fee:', error)
            alert('Failed to update fee: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[#336b6e]">Edit Fee Structure</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Total Fee (₹)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.total_fee}
                                onChange={(e) => handleChange('total_fee', e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Platform Fee (%)</label>
                        <input
                            type="number"
                            required
                            min="0"
                            max="100"
                            step="0.1"
                            value={formData.platform_fee_percentage}
                            onChange={(e) => handleChange('platform_fee_percentage', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Trainer Income (₹)</label>
                        <input
                            type="text"
                            readOnly
                            value={formData.trainer_income}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Frequency</label>
                        <select
                            value={formData.fee_frequency}
                            onChange={(e) => handleChange('fee_frequency', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                        >
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                            <option value="per_class">Per Class</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Update Fee Details'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default EditFeeModal
