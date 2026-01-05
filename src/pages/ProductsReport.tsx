import { useState, useEffect } from 'react';
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
    // State
    const [products, setProducts] = useState<Product[]>([]);
    const [printProducts, setPrintProducts] = useState<Product[]>([]);
    const [groups, setGroups] = useState<ProductGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        nome: '',
        grupo: ''
    });

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

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
    const [isPreparingPrint, setIsPreparingPrint] = useState(false);

    const getCacheKey = (p: number, f: typeof filters) => `products_cache_p${p}_n${f.nome}_g${f.grupo}`;

    const fetchProducts = async (pageToFetch = 1, useCache = true) => {
        setLoading(true);
        try {
            const cacheKey = getCacheKey(pageToFetch, filters);
            if (useCache) {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    const { data, meta, timestamp } = JSON.parse(cached);
                    // Cache valid for 5 minutes
                    if (Date.now() - timestamp < 5 * 60 * 1000) {
                        setProducts(data);
                        setTotalPages(meta.total_paginas);
                        setPage(pageToFetch);
                        setLoading(false);
                        return;
                    }
                }
            }

            const response = await productService.getAll(pageToFetch, 100, filters.grupo && filters.grupo !== 'all' ? filters.grupo : undefined, filters.nome || undefined);

            // Server-side filtering is now used.

            setProducts(response.data || []);
            setTotalPages(response.meta?.total_paginas || 1);
            setPage(pageToFetch);

            localStorage.setItem(cacheKey, JSON.stringify({
                data: response.data || [],
                meta: response.meta,
                timestamp: Date.now()
            }));

        } catch (error) {
            console.error(error);
            toast.error('Erro ao buscar produtos.');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllForPrint = async () => {
        setIsPreparingPrint(true);
        const toastId = toast.loading('Preparando dados para impressão...');
        try {
            let allData: Product[] = [];
            // We need to fetch all pages.
            // Since we can't easily rely on cache for "all", we might fetch fresh or check cache page by page.
            // For safety and speed, let's just fetch all fresh or loop.

            // First page to get total pages
            const p1 = await productService.getAll(1, 100, filters.grupo && filters.grupo !== 'all' ? filters.grupo : undefined, filters.nome || undefined);
            allData = [...(p1.data || [])];
            const total = p1.meta?.total_paginas || 1;

            if (total > 1) {
                // Fetch remaining
                const promises = [];
                for (let p = 2; p <= total; p++) {
                    promises.push(productService.getAll(p, 100, filters.grupo && filters.grupo !== 'all' ? filters.grupo : undefined, filters.nome || undefined));
                }
                const responses = await Promise.all(promises);
                responses.forEach(r => {
                    if (r.data) allData = [...allData, ...r.data];
                });
            }

            setPrintProducts(allData);
            return true;
        } catch (e) {
            console.error(e);
            toast.error("Erro ao preparar impressão");
            return false;
        } finally {
            toast.dismiss(toastId);
            setIsPreparingPrint(false);
        }
    };

    useEffect(() => {
        fetchProducts(1);
    }, []);

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

    // Filter displayed products (only for the current page items)
    const filteredProducts = products;

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
        const success = await fetchAllForPrint();
        if (success) {
            setTimeout(() => {
                window.print();
            }, 100); // Small delay to allow render
        }
    };

    const handleSearch = () => {
        // Reset to page 1 when searching
        fetchProducts(1, false); // Force refresh
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchProducts(newPage);
        }
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
                            .no-print {
                                display: none !important;
                            }
                        }
                    `}
                </style>
                <div className="text-center font-bold text-xl mb-2">Icore System</div>
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
                        Imprimir / PDF
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
                    <Button onClick={() => handleSearch()} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Atualizar Lista
                    </Button>
                </CardContent>
            </Card>

            {/* Main Paginated Table (Screen Only) */}
            <Card className="print:hidden border-none shadow-none">
                <CardHeader className="px-0 flex flex-row items-center justify-between">
                    <CardTitle>Lista de Produtos (Página {page} de {totalPages})</CardTitle>
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
                            {filteredProducts.map((product) => (
                                <TableRow key={product.id}>
                                    {availableColumns.filter(c => c.visible).map(col => (
                                        <TableCell key={col.id}>
                                            {col.id.includes('valor')
                                                ? Number(product[col.id as keyof Product] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                : (product[col.id as keyof Product] as any)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                            {filteredProducts.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={availableColumns.filter(c => c.visible).length} className="text-center py-8 text-muted-foreground">
                                        Nenhum produto encontrado nesta página.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                    <span>Mostrando {filteredProducts.length} itens</span>
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
                            {showVerificationColumn && (
                                <TableHead className="text-black font-bold w-[100px] text-center border-l">Conf.</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {printProducts.map((product) => (
                            <TableRow key={`print-${product.id}`} className="break-inside-avoid">
                                {availableColumns.filter(c => c.visible).map(col => (
                                    <TableCell key={col.id}>
                                        {col.id.includes('valor')
                                            ? Number(product[col.id as keyof Product] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                            : (product[col.id as keyof Product] as any)}
                                    </TableCell>
                                ))}
                                {showVerificationColumn && (
                                    <TableCell className="text-center border-l border-gray-300 align-middle">
                                        <div className="inline-block w-4 h-4 border border-black rounded-sm"></div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="mt-4 text-right font-bold border-t pt-2">
                    Total Geral: {printProducts.length} itens
                </div>
            </div>

            {/* Dialogs remain same, just logic update already done above */}
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
                            <br />
                            <span className="text-xs text-muted-foreground mt-2 block">
                                Isso irá buscar TODOS os produtos ({groups.find(g => String(g.id) === filters.grupo)?.nome || (filters.grupo === 'all' ? 'Todas as categorias' : 'Filtro atual')}) para gerar o relatório completo.
                            </span>
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

export default ProductsReport;
