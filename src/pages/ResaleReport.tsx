import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { productService, type Product, type ProductGroup } from '@/services/api/products';
import { calculateResalePrice } from '@/lib/pricing';
import { Switch } from '@/components/ui/switch';
import { Loader2, Calculator, Printer, Settings, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function ResaleReport() {
    const [products, setProducts] = useState<Product[]>([]);
    const [groups, setGroups] = useState<ProductGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [markup, setMarkup] = useState<string>('30'); // Default 30%
    const [selectedGroup, setSelectedGroup] = useState<string>('all');
    const [showZeroStock, setShowZeroStock] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage] = useState(100);

    // Column Selection State
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const [availableColumns, setAvailableColumns] = useState([
        { id: 'codigo_interno', label: 'Código', visible: true },
        { id: 'nome', label: 'Descrição', visible: true },
        { id: 'valor_custo', label: 'Valor Custo', visible: true },
        { id: 'markup', label: '+ Margem (%)', visible: true },
        { id: 'preco_revenda', label: 'Valor', visible: true },
        { id: 'estoque', label: 'Estoque', visible: true },
        { id: 'arredondado', label: 'Obs', visible: true }, // Indicator
    ]);

    // Print Configuration State
    const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
    const [showVerificationColumn, setShowVerificationColumn] = useState(false);

    useEffect(() => {
        // Fetch groups
        const loadGroups = async () => {
            try {
                const data = await productService.getGroups();
                setGroups(data || []);
            } catch (error) {
                console.error("Failed to load groups", error);
            }
        };
        loadGroups();
    }, []);

    // Refetch when group changes
    // Refetch when group changes - REMOVED for manual trigger
    // useEffect(() => {
    //    setCurrentPage(1);
    //    if (currentPage === 1) {
    //        fetchProducts(1);
    //    }
    // }, [selectedGroup]);

    useEffect(() => {
        fetchProducts(currentPage);
    }, [currentPage]);

    const fetchProducts = async (page = 1) => {
        setLoading(true);
        try {
            const grupoId = selectedGroup !== 'all' ? selectedGroup : undefined;
            const response = await productService.getAll(page, itemsPerPage, grupoId);
            setProducts(response.data || []);

            if (response.meta) {
                setTotalPages(response.meta.total_paginas);
                setTotalItems(response.meta.total_registros);
            }
            if ((response.data || []).length === 0) {
                toast.info('Nenhum produto encontrado.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao buscar produtos.');
        } finally {
            setLoading(false);
        }
    };

    // Extract unique groups - Deprecated, using API
    // const groups = useMemo(() => {
    //     const unique = new Set(products.map(p => p.nome_grupo).filter(Boolean));
    //     return Array.from(unique).sort();
    // }, [products]);

    // Filter and Calculate
    const calculatedProducts = useMemo(() => {
        // Filter is now server-side, but we can filter zero stock client-side for now
        let filtered = products;

        if (!showZeroStock) {
            filtered = filtered.filter(p => p.estoque > 0);
        }

        return filtered.map(p => {
            const basePrice = parseFloat(p.valor_custo);
            const percentage = parseFloat(markup) || 0;
            const finalPrice = calculateResalePrice(basePrice, percentage);

            return {
                ...p,
                percentual_aplicado: percentage,
                preco_revenda: finalPrice
            };
        });
    }, [products, markup]);

    const toggleColumn = (id: string) => {
        setAvailableColumns(prev => prev.map(col =>
            col.id === id ? { ...col, visible: !col.visible } : col
        ));
    };

    const handlePrintClick = () => {
        setIsPrintDialogOpen(true);
    };

    const confirmPrint = () => {
        setIsPrintDialogOpen(false);
        // Wait for state update and dialog close before printing
        setTimeout(() => {
            window.print();
        }, 500);
    };

    // Helper to get column visibility
    const isColVisible = (id: string) => availableColumns.find(c => c.id === id)?.visible;

    return (
        <div className="space-y-6">
            {/* Print Header - Visible only when printing */}
            <div className="hidden print:block mb-8">
                <style type="text/css" media="print">
                    {`
                        @page { 
                            size: portrait; 
                            margin: 10mm;
                        }
                        @media print {
                            body {
                                -webkit-print-color-adjust: exact;
                            }
                            table {
                                font-size: 10px;
                            }
                            td, th {
                                padding: 4px !important;
                            }
                        }
                    `}
                </style>
                <div className="text-center font-bold text-xl mb-2">AYLA DIGITAL</div>
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
                <div className="text-center font-bold text-lg uppercase mb-2">Orçamentos</div>

                {/* Print Context Info */}
                <div className="mb-4 p-2 border rounded bg-gray-50 text-sm flex justify-center gap-6">
                    <span>Categoria: <strong>{selectedGroup === 'all' ? 'Todas' : (groups.find(g => String(g.id) === selectedGroup)?.nome || selectedGroup)}</strong></span>
                </div>
            </div>

            <div className="flex items-center justify-between no-print">
                <h1 className="text-3xl font-bold tracking-tight">Orçamentos</h1>
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
                    <CardTitle>Configuração e Visualização</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-muted/20 rounded-lg items-end">
                        <div className="w-full md:w-1/3 space-y-2">
                            <label className="text-sm font-medium">Categoria / Grupo</label>
                            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um grupo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    {groups.map(g => (
                                        <SelectItem key={g.id} value={String(g.id)}>{g.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full md:w-1/4 space-y-2">
                            <label className="text-sm font-medium">Porcentagem de Margem (%)</label>
                            <div className="relative">
                                <Calculator className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                type="number"
                                value={markup}
                                onChange={(e) => setMarkup(e.target.value)}
                                className="pl-8"
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-auto pb-0.5">
                            <Button onClick={() => { setCurrentPage(1); fetchProducts(1); }} className="w-full md:w-auto">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Carregar
                            </Button>
                        </div>
                        <div className="w-full md:w-1/4 space-y-2 flex items-center gap-2 pb-2">
                            <div className="flex items-center space-x-2">
                                <Switch id="zero-stock" checked={showZeroStock} onCheckedChange={setShowZeroStock} />
                                <label htmlFor="zero-stock" className="text-sm font-medium">Exibir estoque zero</label>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="print-shadow-none border-none shadow-none">
                <CardContent className="p-0">
                    <div className="border rounded-md print:border-none">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {isColVisible('codigo_interno') && <TableHead className="text-black font-bold">Código</TableHead>}
                                    {isColVisible('nome') && <TableHead className="text-black font-bold">Descrição</TableHead>}
                                    {isColVisible('valor_custo') && <TableHead className="text-black font-bold">Valor Custo</TableHead>}
                                    {isColVisible('markup') && <TableHead className="text-black font-bold">+ Margem (%)</TableHead>}
                                    {isColVisible('preco_revenda') && <TableHead className="text-black font-bold text-green-700">Valor</TableHead>}
                                    {isColVisible('estoque') && <TableHead className="text-black font-bold text-center w-[80px]">Estoque</TableHead>}
                                    {isColVisible('arredondado') && <TableHead className="text-xs text-muted-foreground text-right w-[100px]">Arredondado</TableHead>}
                                    {showVerificationColumn && (
                                        <TableHead className="text-black font-bold w-[100px] text-center print:table-cell hidden">Conferência</TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></TableCell>
                                    </TableRow>
                                ) : (
                                    calculatedProducts.map(product => (
                                        <TableRow key={product.id} className="break-inside-avoid">
                                            {isColVisible('codigo_interno') && <TableCell>{product.codigo_interno}</TableCell>}
                                            {isColVisible('nome') && <TableCell className="font-medium">{product.nome}</TableCell>}
                                            {isColVisible('valor_custo') && <TableCell>{parseFloat(product.valor_custo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>}
                                            {isColVisible('markup') && <TableCell>{markup}%</TableCell>}
                                            {isColVisible('preco_revenda') && (
                                                <TableCell className="font-bold text-lg text-green-700">
                                                    {product.preco_revenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </TableCell>
                                            )}
                                            {isColVisible('estoque') && (
                                                <TableCell className={`text-center font-medium ${product.estoque <= 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                                    {product.estoque}
                                                </TableCell>
                                            )}
                                            {isColVisible('arredondado') && (
                                                <TableCell className="text-right text-xs text-muted-foreground">
                                                    (Arred. cima)
                                                </TableCell>
                                            )}
                                            {showVerificationColumn && (
                                                <TableCell className="text-center print:table-cell hidden border-l border-gray-300">
                                                    <div className="inline-block w-4 h-4 border border-black rounded-sm print:inline-block"></div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                                {!loading && calculatedProducts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            Nenhum produto encontrado na categoria selecionada.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <div className="mt-4 text-right font-bold print:mr-4">
                    Total de itens: {totalItems}
                </div>
            </Card>

            <Card className="no-print mt-4">
                <div className="flex items-center justify-between p-4">
                    <div className="text-sm text-gray-500">
                        Página {currentPage} de {totalPages} (Total: {totalItems} itens)
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || loading}
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || loading}
                        >
                            Próximo
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Column Configuration Dialog */}
            <Dialog open={isColumnModalOpen} onOpenChange={setIsColumnModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Personalizar Relatório</DialogTitle>
                        <DialogDescription>
                            Selecione as colunas que deseja exibir no relatório e na impressão.
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
                            id="verify-col-resale"
                            checked={showVerificationColumn}
                            onCheckedChange={(checked) => setShowVerificationColumn(checked as boolean)}
                        />
                        <label
                            htmlFor="verify-col-resale"
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
        </div>
    );
}
