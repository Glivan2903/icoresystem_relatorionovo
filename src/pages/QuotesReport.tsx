import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { addCompanyHeader } from '@/lib/reportUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { quotesService, type Quote } from '@/services/api/quotes';
import { Loader2, Printer, Settings, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

export default function QuotesReport() {
    // State
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(false);

    // Column Selection State
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const [availableColumns, setAvailableColumns] = useState([
        { id: 'id', label: 'Nº Orçamento', visible: true },
        { id: 'cliente_nome', label: 'Cliente', visible: true },
        { id: 'data', label: 'Data', visible: true },
        { id: 'total', label: 'Total', visible: true },
        { id: 'situacao', label: 'Situação', visible: true },
        { id: 'vendedor', label: 'Vendedor', visible: false },
    ]);

    const fetchAllQuotes = async () => {
        setLoading(true);
        try {
            const toastId = toast.loading('Carregando orçamentos...');
            // Page 1
            const response = await quotesService.getAll(undefined, undefined, 1, 100);
            let allData = response.data || [];

            if (response.meta && response.meta.total_paginas > 1) {
                const totalPages = response.meta.total_paginas;
                for (let p = 2; p <= totalPages; p++) {
                    toast.loading(`Carregando página ${p} de ${totalPages}...`, { id: toastId });
                    await new Promise(r => setTimeout(r, 250));
                    const nextRes = await quotesService.getAll(undefined, undefined, p, 100);
                    if (nextRes.data) {
                        allData = [...allData, ...nextRes.data];
                    }
                }
            }

            setQuotes(allData);
            if (allData.length === 0) {
                toast.info('Nenhum orçamento encontrado.');
            }
            toast.dismiss(toastId);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao buscar orçamentos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllQuotes();
    }, []);

    const exportPDF = () => {
        const doc = new jsPDF();
        addCompanyHeader(doc, 'Relatório de Orçamentos');

        autoTable(doc, {
            startY: 65,
            head: [['Data', 'Cliente', 'Situação', 'Total']],
            body: quotes.map(q => [
                q.data,
                q.nome_cliente,
                q.situacao,
                parseFloat(q.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            ]),
        });
        doc.save('orcamentos.pdf');
    };

    const toggleColumn = (id: string) => {
        setAvailableColumns(prev => prev.map(col =>
            col.id === id ? { ...col, visible: !col.visible } : col
        ));
    };

    const handlePrint = () => {
        setTimeout(() => {
            window.print();
        }, 500);
    };

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(quotes.map(q => ({
            'Data': q.data,
            'Cliente': q.nome_cliente,
            'Situação': q.situacao,
            'Total': parseFloat(q.valor_total)
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Orçamentos');
        XLSX.writeFile(wb, 'orcamentos.xlsx');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between no-print">
                <h1 className="text-3xl font-bold tracking-tight">Relatório de Orçamentos</h1>
                <div className="flex gap-2">
                    <Button onClick={exportPDF} className="gap-2">
                        <Download className="h-4 w-4" />
                        Exportar PDF
                    </Button>
                    <Button onClick={exportExcel}><Download className="mr-2 h-4 w-4" /> Excel</Button>
                    <Button onClick={() => setIsColumnModalOpen(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Colunas
                    </Button>
                    <Button onClick={handlePrint} className="gap-2">
                        <Printer className="h-4 w-4" />
                        Imprimir
                    </Button>
                </div>
            </div>

            <Card className="print-shadow-none border-none shadow-none">
                <CardHeader className="print-hidden px-0">
                    <CardTitle>Lista de Orçamentos</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {availableColumns.filter(c => c.visible).map(col => (
                                    <TableHead key={col.id} className="text-black font-bold">{col.label}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={availableColumns.filter(c => c.visible).length} className="text-center py-8"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></TableCell>
                                </TableRow>
                            ) : (
                                quotes.map((quote) => (
                                    <TableRow key={quote.id} className="break-inside-avoid">
                                        {availableColumns.filter(c => c.visible).map(col => (
                                            <TableCell key={col.id}>
                                                {col.id === 'total'
                                                    ? Number(quote.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                    : col.id === 'data'
                                                        ? new Date(quote.data).toLocaleDateString('pt-BR')
                                                        : (quote as any)[col.id]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                            {quotes.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={availableColumns.filter(c => c.visible).length} className="text-center py-8 text-muted-foreground">
                                        Nenhum orçamento encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <div className="mt-4 text-right font-bold print:mr-4 print:block hidden">
                    Total de itens: {quotes.length}
                </div>
            </Card>

            {/* Column Configuration Dialog */}
            <Dialog open={isColumnModalOpen} onOpenChange={setIsColumnModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Personalizar Relatório</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        {availableColumns.map((col) => (
                            <div key={col.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`col-${col.id}`}
                                    checked={col.visible}
                                    onCheckedChange={() => toggleColumn(col.id)}
                                />
                                <label htmlFor={`col-${col.id}`} className="text-sm font-medium">
                                    {col.label}
                                </label>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
