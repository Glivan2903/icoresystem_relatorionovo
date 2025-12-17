import jsPDF from 'jspdf';

export const addCompanyHeader = (doc: jsPDF, title: string) => {
    // Company Header Data
    const companyName = "AYLA DIGITAL";
    const cnpj = "58.499.151/0001-16";
    const email = "antoniosilva286mv1@gmail.com";
    const phone = "(88) 98171-2559";
    const addressLine1 = "RUA AFONSO RIBEIRO, 436";
    const addressLine2 = "CENTRO, 733 - Missão Velha (CE)";
    const cep = "CEP: 63200-000";

    // Header Styling
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Details Column 1 (Left)
    doc.text(`CNPJ: ${cnpj}`, 14, 30);
    doc.text(`Email: ${email}`, 14, 35);
    doc.text(`Tel: ${phone}`, 14, 40);

    // Details Column 2 (Right) - Aligned to right margin approx 196
    doc.text(addressLine1, 196, 30, { align: 'right' });
    doc.text(addressLine2, 196, 35, { align: 'right' });
    doc.text(cep, 196, 40, { align: 'right' });

    // Divider Line
    doc.setLineWidth(0.5);
    doc.line(14, 45, 196, 45);

    // Report Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 105, 55, { align: 'center' });
};
