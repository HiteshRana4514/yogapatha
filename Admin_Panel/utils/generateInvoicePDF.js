import { jsPDF } from 'jspdf'

/**
 * Generate Invoice PDF and return as base64 string
 * @param {Object} paymentData - Payment transaction data
 * @param {Object} clientData - Client information
 * @param {Object} trainerData - Trainer information
 * @param {Object} invoiceSettings - Invoice settings from database
 * @returns {Promise<string>} Base64 encoded PDF
 */
export const generateInvoicePDF = async (paymentData, clientData, trainerData, invoiceSettings = null) => {
  const doc = new jsPDF('p', 'mm', 'a4')
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - (2 * margin)
  
  // Get settings or use defaults
  const companyName = invoiceSettings?.company_name || 'YogaPatha'
  const companyTagline = invoiceSettings?.company_tagline || 'Professional Yoga Training Platform'
  const companyEmail = invoiceSettings?.email || 'support@yogapatha.com'
  const companyPhone = invoiceSettings?.phone || '+91 XXX XXX XXXX'
  const companyAddress = invoiceSettings?.address || 'Your Company Address Here'
  const invoicePrefix = invoiceSettings?.invoice_prefix || 'YP'
  const footerText = invoiceSettings?.footer_text || 'Thank you for being part of YogaPatha!'
  const termsText = invoiceSettings?.terms_text || 'This is a computer-generated invoice and does not require a signature.'
  
  const parsePrimaryColor = () => {
    if (invoiceSettings?.primary_color) {
      const rgb = invoiceSettings.primary_color.split(',').map(v => parseInt(v.trim()))
      if (rgb.length === 3) return rgb
    }
    return [51, 107, 110]
  }
  
  const primaryColor = parsePrimaryColor()
  const greenColor = [5, 150, 105]
  const redColor = [220, 38, 38]
  const grayColor = [102, 102, 102]
  
  let yPos = 0
  
  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  // Add logo if available
  if (invoiceSettings?.company_logo_url) {
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = invoiceSettings.company_logo_url
      
      await new Promise((resolve) => {
        img.onload = () => {
          try {
            doc.addImage(img, 'PNG', margin, 8, 25, 25)
            resolve()
          } catch (err) {
            resolve()
          }
        }
        img.onerror = () => resolve()
        setTimeout(() => resolve(), 3000)
      })
    } catch (error) {
      console.error('Error loading logo:', error)
    }
  }
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(26)
  doc.setFont('helvetica', 'bold')
  doc.text(companyName, pageWidth / 2, 15, { align: 'center' })
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(companyTagline, pageWidth / 2, 22, { align: 'center' })
  doc.text(`Email: ${companyEmail} | Phone: ${companyPhone}`, pageWidth / 2, 28, { align: 'center' })
  doc.text(companyAddress, pageWidth / 2, 34, { align: 'center' })
  
  yPos = 50
  
  // Title
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYMENT INVOICE', pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 12
  
  // Payment details
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  
  const addRow = (label, value, isBold = false) => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text(label, margin, yPos)
    
    doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    doc.setTextColor(0, 0, 0)
    const valueText = String(value)
    doc.text(valueText, pageWidth - margin, yPos, { align: 'right', maxWidth: contentWidth * 0.6 })
    
    doc.setDrawColor(238, 238, 238)
    doc.setLineWidth(0.1)
    doc.line(margin, yPos + 1.5, pageWidth - margin, yPos + 1.5)
    yPos += 8
  }
  
  addRow('Invoice Number:', `${invoicePrefix}-${paymentData.id.substring(0, 8).toUpperCase()}`)
  addRow('Payment Date:', new Date(paymentData.payment_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }))
  addRow('Client Name:', `${clientData.first_name} ${clientData.last_name}`)
  addRow('Payment Method:', paymentData.payment_method?.replace('_', ' ').toUpperCase())
  
  if (paymentData.transaction_reference) {
    addRow('Transaction Reference:', paymentData.transaction_reference)
  }
  
  if (paymentData.payment_period_start && paymentData.payment_period_end) {
    const periodText = `${new Date(paymentData.payment_period_start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${new Date(paymentData.payment_period_end).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`
    addRow('Payment Period:', periodText)
  }
  
  addRow('Status:', paymentData.status.toUpperCase(), true)
  
  yPos += 5
  
  // Amount box
  const boxHeight = paymentData.total_fee && paymentData.platform_fee ? 60 : 35
  doc.setFillColor(240, 249, 255)
  doc.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, 'F')
  
  yPos += 12
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text(`Rs ${paymentData.trainer_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 7
  doc.setFontSize(9)
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  doc.text('Amount Received', pageWidth / 2, yPos, { align: 'center' })
  
  if (paymentData.total_fee && paymentData.platform_fee) {
    yPos += 10
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    
    const leftX = margin + 10
    const rightX = pageWidth - margin - 10
    
    doc.setFont('helvetica', 'normal')
    doc.text('Total Fee (Client Paid):', leftX, yPos)
    doc.text(`Rs ${paymentData.total_fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, rightX, yPos, { align: 'right' })
    yPos += 6
    
    doc.setTextColor(redColor[0], redColor[1], redColor[2])
    doc.text(`Platform Fee (${paymentData.platform_fee_percentage}%):`, leftX, yPos)
    doc.text(`- Rs ${paymentData.platform_fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, rightX, yPos, { align: 'right' })
    yPos += 8
    
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(0.3)
    doc.line(leftX, yPos, rightX, yPos)
    yPos += 5
    
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(greenColor[0], greenColor[1], greenColor[2])
    doc.text('Your Income:', leftX, yPos)
    doc.text(`Rs ${paymentData.trainer_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, rightX, yPos, { align: 'right' })
    yPos += 8
  } else {
    yPos += boxHeight - 19
  }
  
  // Admin notes
  if (paymentData.admin_notes) {
    yPos += 8
    doc.setFillColor(249, 250, 251)
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(1)
    
    const noteLines = doc.splitTextToSize(paymentData.admin_notes, contentWidth - 10)
    const noteHeight = (noteLines.length * 5) + 12
    
    doc.rect(margin, yPos, contentWidth, noteHeight)
    doc.line(margin, yPos, margin, yPos + noteHeight)
    
    yPos += 7
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Admin Notes:', margin + 5, yPos)
    
    yPos += 5
    doc.setFont('helvetica', 'normal')
    doc.text(noteLines, margin + 5, yPos)
    yPos += noteHeight - 7
  }
  
  // Footer
  const footerY = pageHeight - 20
  doc.setDrawColor(238, 238, 238)
  doc.setLineWidth(0.2)
  doc.line(margin, footerY, pageWidth - margin, footerY)
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(footerText, pageWidth / 2, footerY + 5, { align: 'center' })
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  doc.text(termsText, pageWidth / 2, footerY + 9, { align: 'center' })
  doc.text(`For any queries, please contact us at ${companyEmail}`, pageWidth / 2, footerY + 13, { align: 'center' })
  
  // Return base64 string (without data:application/pdf;base64, prefix)
  const pdfOutput = doc.output('datauristring')
  const base64 = pdfOutput.split(',')[1]
  
  return base64
}
