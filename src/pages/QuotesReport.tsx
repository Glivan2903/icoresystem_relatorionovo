import { useState, useEffect } from 'react';
import { addCompanyHeader } from '@/lib/reportUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { quotesService, type Quote } from '@/services/api/quotes';
import { Loader2, Download, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function QuotesReport() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        setLoading(true);
        try {
            const response = await quotesService.getAll(undefined, undefined, 1);
            setQuotes(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

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

    const handlePrint = () => {
        window.print();
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
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Relatório de Orçamentos</h1>
                <div className="flex gap-2">
                    <Button onClick={exportPDF} className="gap-2">
                        <Download className="h-4 w-4" />
                        Exportar PDF
                    </Button>
                    <Button onClick={exportExcel}><Download className="mr-2 h-4 w-4" /> Excel</Button>
                    <Button onClick={handlePrint} className="gap-2">
                        <Printer className="h-4 w-4" />
                        Imprimir
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listagem de Orçamentos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Situação</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></TableCell>
                                    </TableRow>
                                ) : (
                                    quotes.map(quote => (
                                        <TableRow key={quote.id}>
                                            <TableCell>{quote.data}</TableCell>
                                            <TableCell className="font-medium">{quote.nome_cliente}</TableCell>
                                            <TableCell><Badge variant="outline">{quote.situacao}</Badge></TableCell>
                                            <TableCell className="text-right">{parseFloat(quote.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
