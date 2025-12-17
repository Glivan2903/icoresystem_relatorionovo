import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { salesService, type Sale } from '@/services/api/sales';
import { paymentMethodsService, type PaymentMethod } from '@/services/api/paymentMethods';
import { Printer, Eye, Settings, ShoppingCart } from 'lucide-react';
import { Select as UISelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function SalesReport() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        clientName: '',
        startDate: '',
        endDate: '',
        paymentMethod: ''
    });

    // Column Selection State
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const [availableColumns, setAvailableColumns] = useState([
        { id: 'id', label: 'ID', visible: true },
        { id: 'nome_cliente', label: 'Cliente', visible: true },
        { id: 'data', label: 'Data', visible: true },
        { id: 'valor_total', label: 'Valor Total', visible: true },
        { id: 'nome_forma_pagamento', label: 'Forma de Pagamento', visible: true },
    ]);

    // Print Configuration State
    const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
    const [showVerificationColumn, setShowVerificationColumn] = useState(false);

    // Detail Modal State
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const fetchSales = async () => {
        setLoading(true);
        try {
            // Passing default undefined for dates if empty strings
            const start = filters.startDate || undefined;
            const end = filters.endDate || undefined;

            // Fetching with a limit of 1000 to show a good amount of history
            const response = await salesService.getAll(start, end, 1, 1000);
            setSales(response.data || []);

            if ((response.data || []).length === 0) {
                toast.info('Nenhuma venda encontrada.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao buscar vendas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadPaymentMethods = async () => {
            try {
                const data = await paymentMethodsService.getAll();
                setPaymentMethods(data || []);
            } catch (error) {
                console.error('Failed to load payment methods', error);
            }
        };

        loadPaymentMethods();
        fetchSales();
    }, []);

    const handlePrintClick = () => {
        setIsPrintDialogOpen(true);
    };

    const confirmPrint = () => {
        setIsPrintDialogOpen(false);
        setTimeout(() => {
            window.print();
        }, 500);
    };

    const handleViewDetails = (sale: Sale) => {
        setSelectedSale(sale);
        setIsDetailModalOpen(true);
    };

    const toggleColumn = (id: string) => {
        setAvailableColumns(prev => prev.map(col =>
            col.id === id ? { ...col, visible: !col.visible } : col
        ));
    };

    const filteredSales = sales.filter(sale => {
        const matchName = filters.clientName
            ? (sale.nome_cliente && sale.nome_cliente.toLowerCase().includes(filters.clientName.toLowerCase()))
            : true;

        const matchPayment = filters.paymentMethod && filters.paymentMethod !== 'all'
            ? (() => {
                // Find selected payment method object to check against types if needed
                const selectedMethodObj = paymentMethods.find(pm => pm.nome === filters.paymentMethod);
                const salePayment = (sale.nome_forma_pagamento || '').toLowerCase();
                const filterValue = filters.paymentMethod.toLowerCase();
                const typeValue = selectedMethodObj?.tipo ? selectedMethodObj.tipo.toLowerCase() : '';

                // Match against name OR type (code)
                return salePayment === filterValue || (typeValue && salePayment === typeValue);
            })()
            : true;

        return matchName && matchPayment;
    });


    const formatCurrency = (value: string | number) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div className="space-y-6">
            {/* Print Header */}
            <div className="hidden print:block mb-8">
                <style type="text/css" media="print">
                    {`
                        @page {
                            size: landscape;
                            margin: 10mm;
                        }
                    `}
                </style>
                <div className="text-center font-bold text-2xl mb-4">AYLA DIGITAL</div>
                <div className="flex justify-between text-sm mb-4 border-b pb-4">
                    <div className="text-left space-y-1">
                        <p>CNPJ: 58.499.151/0001-16</p>
                        <p>Email: antoniosilva286mv1@gmail.com</p>
                        <p>Tel: (88) 98171-2559</p>
                    </div>
                    <div className="text-right space-y-1">
                        <p>RUA AFONSO RIBEIRO, 436</p>
                        <p>CENTRO, 733 - Missão Velha (CE)</p>
                        <p>CEP: 63200-000</p>
                    </div>
                </div>
                <div className="text-center font-bold text-xl uppercase mb-6">Relatório de Vendas</div>

                {/* Print Filters Display */}
                {(filters.clientName || filters.paymentMethod || filters.startDate || filters.endDate) && (
                    <div className="mb-4 p-2 border rounded bg-gray-50 text-sm">
                        <span className="font-bold mr-2">Filtros Aplicados:</span>
                        <div className="flex flex-wrap gap-4 mt-1">
                            {filters.clientName && <span>Cliente: <strong>{filters.clientName}</strong></span>}
                            {filters.paymentMethod && <span>Pagamento: <strong>{filters.paymentMethod}</strong></span>}
                            {filters.startDate && <span>Início: <strong>{filters.startDate}</strong></span>}
                            {filters.endDate && <span>Fim: <strong>{filters.endDate}</strong></span>}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between no-print">
                <h1 className="text-3xl font-bold tracking-tight">Relatório de Vendas</h1>
                <div className="flex gap-2">
                    <Button onClick={() => setIsColumnModalOpen(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Colunas
                    </Button>
                    <Button onClick={handlePrintClick} className="gap-2">
                        <Printer className="h-4 w-4" />
                        Imprimir
                    </Button>
                </div>
            </div>

            <Card className="no-print">
                <CardHeader>
                    <CardTitle>Filtros de Busca</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-5 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nome do Cliente</label>
                        <Input
                            value={filters.clientName}
                            onChange={(e) => setFilters(prev => ({ ...prev, clientName: e.target.value }))}
                            placeholder="Buscar por cliente..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Forma de Pagto</label>
                        <UISelect
                            value={filters.paymentMethod}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {paymentMethods.map((method) => (
                                    <SelectItem key={method.id} value={method.nome}>{method.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </UISelect>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Data Início</label>
                        <Input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Data Fim</label>
                        <Input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Button onClick={fetchSales} className="w-full">
                            Filtrar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="print-shadow-none border-none shadow-none">
                <CardHeader className="print-hidden px-0">
                    <CardTitle>Lista de Vendas</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {availableColumns.filter(c => c.visible).map(col => (
                                    <TableHead key={col.id} className="text-black font-bold">
                                        {col.label}
                                    </TableHead>
                                ))}
                                {showVerificationColumn && (
                                    <TableHead className="text-black font-bold w-[100px] text-center print:table-cell hidden">Conf.</TableHead>
                                )}
                                <TableHead className="text-right no-print">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSales.map((sale) => (
                                <TableRow key={sale.id} className="break-inside-avoid">
                                    {availableColumns.filter(c => c.visible).map(col => (
                                        <TableCell key={col.id} className="align-top py-2">
                                            {col.id === 'valor_total'
                                                ? formatCurrency(sale.valor_total)
                                                : (String(sale[col.id as keyof Sale] || '-'))
                                            }
                                        </TableCell>
                                    ))}
                                    {showVerificationColumn && (
                                        <TableCell className="text-center print:table-cell hidden border-l border-gray-300">
                                            <div className="inline-block w-4 h-4 border border-black rounded-sm print:inline-block"></div>
                                        </TableCell>
                                    )}
                                    <TableCell className="text-right no-print align-top">
                                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(sale)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredSales.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={availableColumns.filter(c => c.visible).length + 1} className="text-center py-8 text-muted-foreground">
                                        Nenhuma venda encontrada.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <div className="mt-4 text-right font-bold print:mr-4">
                    Total de itens: {filteredSales.length}
                </div>
            </Card>

            {/* Column Configuration Dialog */}
            <Dialog open={isColumnModalOpen} onOpenChange={setIsColumnModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Personalizar Relatório</DialogTitle>
                        <DialogDescription>
                            Selecione as colunas que deseja exibir.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        {availableColumns.map((col) => (
                            <div key={col.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`col-${col.id}`}
                                    checked={col.visible}
                                    onCheckedChange={() => toggleColumn(col.id)}
                                />
                                <label
                                    htmlFor={`col-${col.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    {col.label}
                                </label>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsColumnModalOpen(false)}>Concluído</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Print Configuration Dialog */}
            <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configuração de Impressão</DialogTitle>
                        <DialogDescription>
                            Deseja adicionar uma coluna de verificação para conferência manual?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 py-4">
                        <Checkbox
                            id="verify-col"
                            checked={showVerificationColumn}
                            onCheckedChange={(checked) => setShowVerificationColumn(checked as boolean)}
                        />
                        <label
                            htmlFor="verify-col"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Adicionar caixa de check para conferência
                        </label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPrintDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={confirmPrint}>Imprimir</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Sale Detail Modal */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto no-print">
                    <DialogHeader>
                        <DialogTitle>Detalhes da Venda</DialogTitle>
                        <DialogDescription>ID: {selectedSale?.id}</DialogDescription>
                    </DialogHeader>

                    {selectedSale && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                                <div><span className="font-bold">Cliente:</span> {selectedSale.nome_cliente}</div>
                                <div><span className="font-bold">Data:</span> {selectedSale.data}</div>
                                <div><span className="font-bold">Valor Total:</span> {formatCurrency(selectedSale.valor_total)}</div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4" />
                                    Produtos
                                </h3>
                                <div className="border rounded-md overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead>Produto</TableHead>
                                                <TableHead className="text-right">Qtd</TableHead>
                                                <TableHead className="text-right">Valor Unit.</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedSale.produtos.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{item.produto.nome_produto || 'Produto Indefinido'}</TableCell>
                                                    <TableCell className="text-right">{item.produto.quantidade}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(item.produto.valor_venda)}</TableCell>
                                                    <TableCell className="text-right font-medium">{formatCurrency(item.produto.valor_total)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
