import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { productService, type Product, type ProductGroup } from '@/services/api/products';
import { Switch } from '@/components/ui/switch';
import { Loader2, Calculator, Printer, Settings, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ReportHeader } from '@/components/shared/ReportHeader';

export default function ResaleReport() {
    // State
    const [products, setProducts] = useState<Product[]>([]);
    const [printProducts, setPrintProducts] = useState<Product[]>([]);
    const [groups, setGroups] = useState<ProductGroup[]>([]);
    const [loading, setLoading] = useState(false);

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [filters, setFilters] = useState({
        nome: '',
        grupo: 'all',
        somenteComEstoque: false,
        priceType: 'custo' as string,
        baseValue: 'venda' as 'custo' | 'venda'
    });

    const [availableTypes, setAvailableTypes] = useState<string[]>([]);

    // Column Selection
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const [availableColumns, setAvailableColumns] = useState([
        { id: 'codigo_interno', label: 'Código', visible: true },
        { id: 'nome', label: 'Descrição', visible: true },
        { id: 'estoque', label: 'Estoque', visible: true },
        { id: 'preco_revenda', label: 'Valor', visible: true },
        { id: 'markup', label: '+ Margem (%)', visible: true },
        { id: 'nome_grupo', label: 'Categoria', visible: false },
        { id: 'valor_custo', label: 'Valor Custo', visible: false },
        { id: 'arredondado', label: 'Obs', visible: true },
    ]);

    // Print config
    const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
    const [showVerificationColumn, setShowVerificationColumn] = useState(false);
    const [isPreparingPrint, setIsPreparingPrint] = useState(false);
    const [markup, setMarkup] = useState<number>(30); // Default 30%

    // Fetch Products (Paginated)
    const fetchProducts = useCallback(async (pageToFetch = 1) => {
        setLoading(true);
        try {
            // For filtering by name with pagination, we rely on the API.
            // If API supports 'nome' and 'grupo_id', we pass them.
            const grupoId = filters.grupo !== 'all' ? filters.grupo : undefined;

            const response = await productService.getAll(pageToFetch, 100, grupoId, filters.nome || undefined);

            setProducts(response.data || []);
            setTotalPages(response.meta?.total_paginas || 1);
            setPage(pageToFetch);

            if (response.data && response.data.length > 0) {
                // Extract available types from the first product that has them
                const firstWithValues = response.data.find(p => p.valores && p.valores.length > 0);
                if (firstWithValues) {
                    const types = firstWithValues.valores.map(v => v.nome_tipo);
                    setAvailableTypes(types);
                }
            }

        } catch (error) {
            console.error(error);
            toast.error('Erro ao buscar produtos.');
        } finally {
            setLoading(false);
        }
    }, [filters.grupo, filters.nome]);

    // Fetch All for Print
    const fetchAllForPrint = async () => {
        setIsPreparingPrint(true);
        const toastId = toast.loading('Preparando dados para impressão...');
        try {
            let allData: Product[] = [];
            const grupoId = filters.grupo !== 'all' ? filters.grupo : undefined;

            // Page 1
            const p1 = await productService.getAll(1, 100, grupoId, filters.nome || undefined);
            allData = [...(p1.data || [])];
            const total = p1.meta?.total_paginas || 1;

            if (total > 1) {
                const promises = [];
                for (let p = 2; p <= total; p++) {
                    promises.push(productService.getAll(p, 100, grupoId, filters.nome || undefined));
                }
                const responses = await Promise.all(promises);
                responses.forEach(r => {
                    if (r.data) allData = [...allData, ...r.data];
                });
            }
            // Filter locally for stock if needed (since API might not support it)
            if (filters.somenteComEstoque) { // Note: variable name logic inverted in UI? "Exibir sem estoque" usually implies showing <= 0.
                // In UI: "Exibir sem estoque" (showNoStock).
                // If the filter state is `somenteComEstoque` (onlyWithStock?), let's check the check logic.
                // In previous code:
                // checked={filters.somenteComEstoque} -> label "Exibir sem estoque". 
                // Wait, if label is "Exibir sem estoque" and variable is "somenteComEstoque", that's confusing.
                // Let's assume the previous logic: "Exibir sem estoque" ON -> Show 0 stock. OFF -> Hide 0 stock.
                // So if !filters.somenteComEstoque (false), we should Hide 0 stock.
                // If filters.somenteComEstoque (true), we should Show 0 stock.
                // Re-reading previous code:
                // if (!filters.somenteComEstoque && p.estoque <= 0) return false; -> If "Exibir sem estoque" is FALSE, we hide <= 0. Correct.
            }

            // Apply stock filter locally for print
            if (!filters.somenteComEstoque) {
                allData = allData.filter(p => p.estoque > 0);
            }

            // Sort alphabetically
            allData.sort((a, b) => a.nome.localeCompare(b.nome));

            // Process prices for print
            const processed = allData.map(p => {
                let basePrice = 0;
                if (filters.priceType === 'custo' || filters.priceType === 'venda') {
                    basePrice = parseFloat(filters.priceType === 'custo' ? p.valor_custo : p.valor_venda);
                } else {
                    const valueObj = p.valores?.find(v => v.nome_tipo === filters.priceType);
                    if (valueObj) {
                        basePrice = parseFloat(filters.baseValue === 'custo' ? valueObj.valor_custo : valueObj.valor_venda);
                    } else {
                        basePrice = parseFloat(p.valor_venda);
                    }
                }
                const finalPrice = calculateResalePrice(basePrice, markup);
                return {
                    ...p,
                    percentual_aplicado: markup,
                    preco_revenda: finalPrice
                };
            });

            setPrintProducts(processed);
            return processed;
        } catch (e) {
            console.error(e);
            toast.error("Erro ao preparar impressão");
            return null;
        } finally {
            toast.dismiss(toastId);
            setIsPreparingPrint(false);
        }
    };


    // Load groups
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

    // Initial load & Filter change (Reset to page 1)
    useEffect(() => {
        fetchProducts(1);
    }, [filters.grupo]); // Only auto-fetch on categorical changes. Name search via button or debounce? Previous code was debounced or button? 
    // Previous code: button "Atualizar Lista" calls fetchAllProducts.
    // Let's keep manual trigger for text search to avoid spamming, but auto-trigger for dropdowns is nice.

    const handleSearch = () => {
        fetchProducts(1);
    }

    // Handle Page Change
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchProducts(newPage);
        }
    };


    const calculateResalePrice = (basePrice: number, percentage: number) => {
        if (isNaN(basePrice) || isNaN(percentage)) return 0;
        const priceWithMarkup = basePrice + (basePrice * (percentage / 100));
        return Math.ceil(priceWithMarkup);
    };

    // Process current page products
    const filteredAndCalculatedProducts = useMemo(() => {
        // We only filter by stock locally for the current page
        let filtered = products;

        if (!filters.somenteComEstoque) {
            filtered = filtered.filter(p => p.estoque > 0);
        }

        return filtered.map(p => {
            let basePrice = 0;

            if (filters.priceType === 'custo' || filters.priceType === 'venda') {
                basePrice = parseFloat(filters.priceType === 'custo' ? p.valor_custo : p.valor_venda);
            } else {
                const valueObj = p.valores?.find(v => v.nome_tipo === filters.priceType);
                if (valueObj) {
                    basePrice = parseFloat(filters.baseValue === 'custo' ? valueObj.valor_custo : valueObj.valor_venda);
                } else {
                    basePrice = parseFloat(p.valor_venda);
                }
            }

            const finalPrice = calculateResalePrice(basePrice, markup);

            return {
                ...p,
                percentual_aplicado: markup,
                preco_revenda: finalPrice
            };
        });
    }, [products, filters.somenteComEstoque, markup, filters.priceType, filters.baseValue]);

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

    return (
        <div className="space-y-6">
            {/* Print Header */}
            <ReportHeader title="Tabela de Revenda">
                {(filters.nome || (filters.grupo && filters.grupo !== 'all')) && (
                    <div className="mb-6 p-3 border border-gray-200 rounded-lg bg-gray-100 text-xs flex flex-wrap justify-center gap-x-6 gap-y-2">
                        {filters.nome && <span>Busca: <strong>{filters.nome}</strong></span>}
                        {filters.grupo && filters.grupo !== 'all' && <span>Categoria: <strong>{groups.find(g => String(g.id) === filters.grupo)?.nome || filters.grupo}</strong></span>}
                    </div>
                )}
            </ReportHeader>

            <div className="flex items-center justify-between no-print">
                <h1 className="text-3xl font-bold tracking-tight">Tabela de Revenda</h1>
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
                    <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nome / Código</label>
                            <Input
                                value={filters.nome}
                                onChange={(e) => setFilters(prev => ({ ...prev, nome: e.target.value }))}
                                placeholder="Buscar..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Categoria</label>
                            <Select
                                value={filters.grupo}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, grupo: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    {groups.map((group) => (
                                        <SelectItem key={group.id} value={String(group.id)}>{group.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Margem / Desconto (%)</label>
                            <div className="relative">
                                <Calculator className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    value={markup}
                                    onChange={(e) => setMarkup(Number(e.target.value))}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tabela de Preço</label>
                            <Select
                                value={filters.priceType}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, priceType: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="custo">Padrão (Custo)</SelectItem>
                                    <SelectItem value="venda">Padrão (Venda)</SelectItem>
                                    {availableTypes.map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {availableTypes.includes(filters.priceType) && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Base de Valor</label>
                                <Select
                                    value={filters.baseValue}
                                    onValueChange={(value) => setFilters(prev => ({ ...prev, baseValue: value as 'custo' | 'venda' }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="custo">Valor de Custo</SelectItem>
                                        <SelectItem value="venda">Valor de Venda</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2 flex items-center h-10 pb-2">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="stock-filter"
                                    checked={filters.somenteComEstoque}
                                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, somenteComEstoque: checked }))}
                                />
                                <label htmlFor="stock-filter" className="text-sm font-medium">
                                    Exibir sem estoque
                                </label>
                            </div>
                        </div>
                        <Button onClick={handleSearch} disabled={loading} className="w-full md:w-auto">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Filtrar
                        </Button>
                    </div>
                </CardContent>
            </Card>

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
                                    <TableHead key={col.id} className="text-black font-bold">
                                        {col.label}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={availableColumns.filter(c => c.visible).length + 1} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAndCalculatedProducts.map((product) => (
                                    <TableRow key={product.id}>
                                        {availableColumns.filter(c => c.visible).map(col => (
                                            <TableCell key={col.id}>
                                                {col.id === 'estoque' ? (
                                                    <span className={product.estoque <= 0 ? 'text-red-500 font-bold' : ''}>
                                                        {product.estoque}
                                                    </span>
                                                ) : col.id === 'preco_revenda' ? (
                                                    <span className="font-bold text-green-700">
                                                        {(product as any).preco_revenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </span>
                                                ) : col.id.includes('valor') ? (
                                                    Number(product[col.id as keyof Product]).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                ) : col.id === 'markup' ? (
                                                    `${(product as any).percentual_aplicado}%`
                                                ) : col.id === 'arredondado' ? (
                                                    <span className="text-xs text-muted-foreground">(Arred.)</span>
                                                ) : col.id === 'valores' ? (
                                                    <span className="text-xs">{product.valores?.length || 0} tipos</span>
                                                ) : (
                                                    (product as any)[col.id]
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                            {filteredAndCalculatedProducts.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={availableColumns.filter(c => c.visible).length + 1} className="text-center py-8 text-muted-foreground">
                                        Nenhum produto encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                    <span>Mostrando {filteredAndCalculatedProducts.length} itens</span>
                </div>
            </Card>

            {/* FULL Print Table (Hidden on Screen, Visible on Print) */}
            <div className="hidden print:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {availableColumns.filter(c => c.visible).map(col => (
                                <TableHead key={col.id} className="text-black font-bold">
                                    {col.label}
                                </TableHead>
                            ))}
                            {showVerificationColumn && <TableHead className="text-center font-bold">Conf.</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {printProducts.map((product, index) => (
                            <TableRow key={`print-${product.id}`} className={`break-inside-avoid ${index % 2 === 0 ? 'bg-white' : 'bg-[#FFFDE7]'}`}>
                                {availableColumns.filter(c => c.visible).map(col => (
                                    <TableCell key={col.id}>
                                        {col.id === 'estoque' ? (
                                            <span className={product.estoque <= 0 ? 'text-red-500 font-bold' : ''}>
                                                {product.estoque}
                                            </span>
                                        ) : col.id === 'preco_revenda' ? (
                                            <span className="font-bold text-yellow-600">
                                                {(product as any).preco_revenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        ) : col.id.includes('valor') ? (
                                            <span className="text-yellow-600 font-bold">
                                                {Number(product[col.id as keyof Product]).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        ) : col.id === 'markup' ? (
                                            `${(product as any).percentual_aplicado}%`
                                        ) : col.id === 'arredondado' ? (
                                            <span className="text-xs text-muted-foreground">(Arred.)</span>
                                        ) : col.id === 'valores' ? (
                                            <span className="text-xs">{product.valores?.length || 0} tipos</span>
                                        ) : (
                                            (product as any)[col.id]
                                        )}
                                    </TableCell>
                                ))}
                                {showVerificationColumn && (
                                    <TableCell className="text-center border-l border-gray-300">
                                        <div className="inline-block w-4 h-4 border border-black rounded-sm"></div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isColumnModalOpen} onOpenChange={setIsColumnModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Colunas</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        {availableColumns.map((col) => (
                            <div key={col.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`col-${col.id}`}
                                    checked={col.visible}
                                    onCheckedChange={() => toggleColumn(col.id)}
                                />
                                <label htmlFor={`col-${col.id}`}>{col.label}</label>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Opções de Impressão</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="verify-col-resale"
                                checked={showVerificationColumn}
                                onCheckedChange={(checked) => setShowVerificationColumn(checked as boolean)}
                            />
                            <label htmlFor="verify-col-resale">Adicionar coluna de conferência</label>
                        </div>
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
