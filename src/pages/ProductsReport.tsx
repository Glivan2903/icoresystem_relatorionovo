import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select as UISelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { productService, type Product, type ProductGroup } from '@/services/api/products';
import { Loader2, Search, Printer, Settings } from 'lucide-react';
import { toast } from 'sonner';

export function ProductsReport() {
    const [products, setProducts] = useState<Product[]>([]);
    const [groups, setGroups] = useState<ProductGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        nome: '',
        grupo: ''
    });

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
        { id: 'estoque', label: 'Estoque', visible: true },
        { id: 'nome_grupo', label: 'Categoria', visible: false },
        { id: 'valor_venda', label: 'Valor Venda', visible: false },
        { id: 'id', label: 'ID Sistema', visible: false },
    ]);

    // Print Configuration State
    const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
    const [showVerificationColumn, setShowVerificationColumn] = useState(false);

    const fetchProducts = async (page = 1) => {
        setLoading(true);
        try {
            const response = await productService.getAll(page, itemsPerPage, filters.grupo && filters.grupo !== 'all' ? filters.grupo : undefined);
            setProducts(response.data || []);

            if (response.meta) {
                setTotalPages(response.meta.total_paginas);
                setTotalItems(response.meta.total_registros);
            }

            if ((response.data || []).length === 0) {
                toast.info('Nenhum produto encontrado nesta página.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao buscar produtos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts(currentPage);
    }, [currentPage]);

    // Fetch groups on mount
    useEffect(() => {
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

    // Extract unique categories for the filter dropdown (Deprecated - now using API groups)
    // const categories = useMemo(() => {
    //     const unique = new Set(products.map(p => p.nome_grupo).filter(Boolean));
    //     return Array.from(unique).sort();
    // }, [products]);

    // Apply filters (Client-side filtering for name only, group is server-side)
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchNome = filters.nome
                ? p.nome.toLowerCase().includes(filters.nome.toLowerCase()) || (p.codigo_interno && p.codigo_interno.includes(filters.nome))
                : true;
            // Removed client-side group filter as it's now handled by the API
            return matchNome;
        });
    }, [products, filters.nome]);

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
                <div className="text-center font-bold text-lg uppercase mb-2">Relatório de Produtos</div>

                {/* Print Filters Display */}
                {(filters.nome || (filters.grupo && filters.grupo !== 'all')) && (
                    <div className="mb-4 p-2 border rounded bg-gray-50 text-sm">
                        <span className="font-bold mr-2">Filtros Aplicados:</span>
                        <div className="flex gap-4 mt-1">
                            {filters.nome && (
                                <span>Nome/Código: <strong>{filters.nome}</strong></span>
                            )}
                            {filters.grupo && filters.grupo !== 'all' && (
                                <span>Categoria: <strong>{groups.find(g => String(g.id) === filters.grupo)?.nome || filters.grupo}</strong></span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between no-print">
                <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
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
                <CardContent className="grid gap-4 md:grid-cols-3 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nome / Código</label>
                        <Input
                            value={filters.nome}
                            onChange={(e) => setFilters(prev => ({ ...prev, nome: e.target.value }))}
                            placeholder="Buscar por nome ou código..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Categoria</label>
                        <UISelect
                            value={filters.grupo}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, grupo: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todas as categorias" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as categorias</SelectItem>
                                {groups.map((group) => (
                                    <SelectItem key={group.id} value={String(group.id)}>{group.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </UISelect>
                    </div>
                    <Button onClick={() => fetchProducts(currentPage)} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Atualizar Lista
                    </Button>
                </CardContent>
            </Card>

            <Card className="print-shadow-none border-none shadow-none">
                <CardHeader className="print-hidden px-0">
                    <CardTitle>Lista de Produtos</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {availableColumns.filter(c => c.visible).map(col => (
                                    <TableHead key={col.id} className="text-black font-bold">{col.label}</TableHead>
                                ))}
                                {showVerificationColumn && (
                                    <TableHead className="text-black font-bold w-[100px] text-center print:table-cell hidden">Conferência</TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.map((product) => (
                                <TableRow key={product.id} className="break-inside-avoid">
                                    {availableColumns.filter(c => c.visible).map(col => (
                                        <TableCell key={col.id}>
                                            {col.id.includes('valor')
                                                ? Number(product[col.id as keyof Product]).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                : product[col.id as keyof Product]}
                                        </TableCell>
                                    ))}
                                    {showVerificationColumn && (
                                        <TableCell className="text-center print:table-cell hidden border-l border-gray-300">
                                            <div className="inline-block w-4 h-4 border border-black rounded-sm print:inline-block"></div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                            {filteredProducts.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={availableColumns.filter(c => c.visible).length + (showVerificationColumn ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                                        Nenhum produto encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <div className="flex items-center justify-between p-4 border-t no-print">
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
                <div className="mt-4 text-right font-bold print:mr-4 print:block hidden">
                    Total de itens: {totalItems}
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
        </div>
    );
}

export default ProductsReport;
