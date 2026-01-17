import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { addCompanyHeader } from '@/lib/reportUtils';
import { ReportHeader } from '@/components/shared/ReportHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { quotesService, type Quote } from '@/services/api/quotes';
import { Loader2, Printer, Settings, Download, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

export default function QuotesReport() {
    // State
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [printQuotes, setPrintQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        clientName: '',
        startDate: '',
        endDate: ''
    });

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

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

    // Print State
    const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
    const [isPreparingPrint, setIsPreparingPrint] = useState(false);

    const fetchQuotes = async (pageToFetch = 1) => {
        setLoading(true);
        try {
            const response = await quotesService.getAll(
                filters.startDate || undefined,
                filters.endDate || undefined,
                pageToFetch,
                100,
                filters.clientName || undefined
            );

            setQuotes(response.data || []);
            setTotalPages(response.meta?.total_paginas || 1);
            setPage(pageToFetch);

        } catch (error) {
            console.error(error);
            toast.error("Erro ao buscar orçamentos");
        } finally {
            setLoading(false);
        }
    };

    const fetchAllForPrint = async () => {
        setIsPreparingPrint(true);
        const toastId = toast.loading('Preparando dados para impressão...');
        try {
            let allData: Quote[] = [];

            // Fetch page 1 to get total pages and initial data
            const p1 = await quotesService.getAll(
                filters.startDate || undefined,
                filters.endDate || undefined,
                1,
                100,
                filters.clientName || undefined
            );

            allData = [...(p1.data || [])];
            const total = p1.meta?.total_paginas || 1;

            if (total > 1) {
                const promises = [];
                for (let p = 2; p <= total; p++) {
                    promises.push(quotesService.getAll(
                        filters.startDate || undefined,
                        filters.endDate || undefined,
                        p,
                        100,
                        filters.clientName || undefined
                    ));
                }
                const responses = await Promise.all(promises);
                responses.forEach(r => {
                    if (r.data) allData = [...allData, ...r.data];
                });
            }

            // Sort alphabetically by client name
            allData.sort((a, b) => a.nome_cliente.localeCompare(b.nome_cliente));

            setPrintQuotes(allData);
            return allData;

        } catch (e) {
            console.error(e);
            toast.error("Erro ao preparar impressão");
            return null;
        } finally {
            toast.dismiss(toastId);
            setIsPreparingPrint(false);
        }
    };

    useEffect(() => {
        fetchQuotes(1);
    }, []);

    const handleSearch = () => {
        fetchQuotes(1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchQuotes(newPage);
        }
    };

    const exportPDF = async () => {
        const data = await fetchAllForPrint();
        if (!data) return;

        const doc = new jsPDF();
        addCompanyHeader(doc, 'Relatório de Orçamentos');

        autoTable(doc, {
            startY: 65,
            head: [['Data', 'Cliente', 'Situação', 'Total']],
            body: data.map(q => [
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

    const handlePrintClick = () => {
        setIsPrintDialogOpen(true);
    };

    const confirmPrint = async () => {
        setIsPrintDialogOpen(false);
        const data = await fetchAllForPrint();
        if (data) {
            setTimeout(() => {
                window.print();
            }, 500);
        }
    };

    const exportExcel = async () => {
        const data = await fetchAllForPrint();
        if (!data) return;

        const ws = XLSX.utils.json_to_sheet(data.map(q => ({
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
            {/* Print Header */}
            <ReportHeader title="Relatório de Orçamentos">
                {(filters.clientName || filters.startDate || filters.endDate) && (
                    <div className="mb-4 p-2 border rounded bg-gray-100 text-sm">
                        <span className="font-bold mr-2">Filtros Aplicados:</span>
                        <div className="flex gap-4 mt-1">
                            {filters.clientName && <span>Cliente: <strong>{filters.clientName}</strong></span>}
                            {filters.startDate && <span>De: <strong>{new Date(filters.startDate).toLocaleDateString()}</strong></span>}
                            {filters.endDate && <span>Até: <strong>{new Date(filters.endDate).toLocaleDateString()}</strong></span>}
                        </div>
                    </div>
                )}
            </ReportHeader>

            <div className="flex items-center justify-between no-print">
                <h1 className="text-3xl font-bold tracking-tight">Relatório de Orçamentos</h1>
                <div className="flex gap-2">
                    <Button onClick={exportPDF} variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        PDF
                    </Button>
                    <Button onClick={exportExcel} variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Excel
                    </Button>
                    <Button onClick={() => setIsColumnModalOpen(true)} variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Colunas
                    </Button>
                    <Button onClick={handlePrintClick} className="gap-2">
                        <Printer className="h-4 w-4" />
                        Imprimir
                    </Button>
                </div>
            </div>

            {/* Filters Card */}
            <Card className="no-print">
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-4 items-end">
                        <div className="space-y-2">
                            <Label>Nome do Cliente / Nº Orçamento</Label>
                            <Input
                                value={filters.clientName}
                                onChange={(e) => setFilters(prev => ({ ...prev, clientName: e.target.value }))}
                                placeholder="Buscar..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Data Início</Label>
                            <Input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Data Fim</Label>
                            <Input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Filtrar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="print:hidden border-none shadow-none">
                <CardHeader className="px-0 flex flex-row items-center justify-between">
                    <CardTitle>Lista de Orçamentos (Página {page} de {totalPages})</CardTitle>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page <= 1 || loading}
                        >
                            Anterior
                        </Button>
                        <span className="flex items-center px-2 font-medium">
                            {page} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page >= totalPages || loading}
                        >
                            Próxima
                        </Button>
                    </div>
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
                                    <TableRow key={quote.id}>
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
                <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                    <span>Mostrando {quotes.length} itens</span>
                </div>
            </Card>

            {/* FULL Print Table (Hidden on Screen, Visible on Print) */}
            <div className="hidden print:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {availableColumns.filter(c => c.visible).map(col => (
                                <TableHead key={col.id} className="text-black font-bold">{col.label}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {printQuotes.map((quote, index) => (
                            <TableRow key={`print-${quote.id}`} className={`break-inside-avoid ${index % 2 === 0 ? 'bg-white' : 'bg-[#FFFDE7]'}`}>
                                {availableColumns.filter(c => c.visible).map(col => (
                                    <TableCell key={col.id} className={col.id === 'total' ? 'text-yellow-600 font-bold' : ''}>
                                        {col.id === 'total'
                                            ? Number(quote.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                            : col.id === 'data'
                                                ? new Date(quote.data).toLocaleDateString('pt-BR')
                                                : (quote as any)[col.id]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

            </div>

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

            {/* Print Configuration Dialog */}
            <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Impressão</DialogTitle>
                        <DialogDescription>
                            Isso irá buscar TODOS os orçamentos para gerar o relatório completo.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPrintDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={confirmPrint} disabled={isPreparingPrint}>
                            {isPreparingPrint ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                            {isPreparingPrint ? 'Preparando...' : 'Imprimir'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
