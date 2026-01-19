import jsPDF from 'jspdf';

export const addCompanyHeader = (doc: jsPDF, title: string) => {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    const boxHeight = 35;
    const boxWidth = pageWidth - (margin * 2);
    const startY = 10;

    // 1. Yellow Box Background
    doc.setFillColor(255, 249, 196); // #FFF9C4 (Light Yellow)
    doc.setDrawColor(255, 193, 7);   // #FFC107 (Amber/Gold Border)
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, startY, boxWidth, boxHeight, 3, 3, 'FD');

    // 2. Center Content (Company Name & Slogan)
    const centerX = pageWidth / 2;

    // Title: DISTRIBUIDORA ICORETECH
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("DISTRIBUIDORA", centerX, startY + 10, { align: 'center' });
    doc.text("ICORETECH", centerX, startY + 16, { align: 'center' });

    // Subtitle / Slogan
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text("8 Anos Distribuindo para região do cariri", centerX, startY + 22, { align: 'center' });
    doc.text("(Até aqui o Senhor nos ajudou)", centerX, startY + 25, { align: 'center' });


    // 3. Left Content (Address)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    const leftX = margin + 5;
    doc.text("Rua Da Paz 92 - Pirajá", leftX, startY + 12);
    doc.text("Juazeiro do Norte (CE)", leftX, startY + 17);


    // 4. Right Content (Contact)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const rightX = pageWidth - margin - 5;
    doc.text("WhatsApp (88) 98863-8990", rightX, startY + 12, { align: 'right' });
    doc.text("Instagram @icore.peças", rightX, startY + 17, { align: 'right' });


    // 5. Page Title (Outside Box)
    // "TABELA DE PREÇO" (Dynamic Title passed as arg)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    const titleY = startY + boxHeight + 10;
    doc.text(title.toUpperCase(), centerX, titleY, { align: 'center' });

    // Underline for Title
    const titleWidth = doc.getTextWidth(title.toUpperCase());
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(centerX - (titleWidth / 2) - 5, titleY + 2, centerX + (titleWidth / 2) + 5, titleY + 2);

    // Reset Font for content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
};
