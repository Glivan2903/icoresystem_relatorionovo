import jsPDF from 'jspdf';

export const addCompanyHeader = (doc: jsPDF, title: string) => {
    // Company Header Data
    // Company Header Data
    const companyName = "iCore Tech";
    const subTitle = "Distribuidora IcoreTech";
    const instagram = "Instagram: icore.peças";
    const phone = "(88) 98171-2559";
    const addressLine1 = "Rua Da Paz 92";
    const addressLine2 = "Pirajá, Juazeiro do Norte (CE)";
    const footerText = "8 Anos Distribuindo para região do cariri - (Até aqui o Senhor nos ajudou)";

    // Header Styling
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(232, 29, 136); // #E81D88
    doc.text(companyName, 105, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(subTitle, 105, 27, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(footerText, 105, 32, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    // Address and Contact
    doc.text(`${addressLine1} - ${addressLine2}`, 105, 38, { align: 'center' });
    doc.text(`Tel: ${phone}  |  ${instagram}`, 105, 43, { align: 'center' });

    // Divider Line
    doc.setDrawColor(251, 192, 45); // #FBC02D (Yellowish border color from requirement)
    doc.setLineWidth(1);
    doc.line(14, 48, 196, 48);

    // Report Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 105, 55, { align: 'center' });
};
