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

export default function ResaleReport() {
    // State
    const [products, setProducts] = useState<Product[]>([]);
    const [groups, setGroups] = useState<ProductGroup[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        nome: '',
        grupo: 'all',
        somenteComEstoque: false,
        priceType: 'custo' as string, // Changed to string to support dynamic types
        baseValue: 'venda' as 'custo' | 'venda' // New: Select Cost or Sale base
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
    const [markup, setMarkup] = useState<number>(30); // Default 30%

    // Fetch All Data
    const fetchAllProducts = useCallback(async () => {
        setLoading(true);
        try {
            const toastId = toast.loading('Carregando produtos para revenda...');
            const grupoId = filters.grupo !== 'all' ? filters.grupo : undefined;

            // Page 1
            const response = await productService.getAll(1, 100, grupoId);
            let allData = response.data || [];

            if (response.meta && response.meta.total_paginas > 1) {
                const totalPages = response.meta.total_paginas;
                for (let p = 2; p <= totalPages; p++) {
                    toast.loading(`Carregando página ${p} de ${totalPages}...`, { id: toastId });
                    await new Promise(r => setTimeout(r, 250));
                    const nextRes = await productService.getAll(p, 100, grupoId);
                    if (nextRes.data) {
                        allData = [...allData, ...nextRes.data];
                    }
                }
            }

            setProducts(allData);

            if (allData.length === 0) {
                toast.info('Nenhum produto encontrado.');
            }

            // Extract available types from the first product that has them
            const firstWithValues = allData.find(p => p.valores && p.valores.length > 0);
            if (firstWithValues) {
                const types = firstWithValues.valores.map(v => v.nome_tipo);
                setAvailableTypes(types);
            }

            toast.dismiss(toastId);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao buscar produtos.');
        } finally {
            setLoading(false);
        }
    }, [filters.grupo]);

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

    // Initial load
    useEffect(() => {
        fetchAllProducts();
    }, [fetchAllProducts]);

    const calculateResalePrice = (basePrice: number, percentage: number) => {
        if (isNaN(basePrice) || isNaN(percentage)) return 0;
        const priceWithMarkup = basePrice + (basePrice * (percentage / 100));
        // Round up to the nearest whole number (Real)
        return Math.ceil(priceWithMarkup);
    };

    const filteredAndCalculatedProducts = useMemo(() => {
        let filtered = products;

        // 1. Filter by Name/Code
        if (filters.nome) {
            filtered = filtered.filter(p =>
                p.nome.toLowerCase().includes(filters.nome.toLowerCase()) ||
                (p.codigo_interno && p.codigo_interno.toLowerCase().includes(filters.nome.toLowerCase()))
            );
        }

        // 2. Filter by Stock
        if (!filters.somenteComEstoque) {
            filtered = filtered.filter(p => p.estoque > 0);
        }

        return filtered.map(p => {
            let basePrice = 0;

            if (filters.priceType === 'custo' || filters.priceType === 'venda') {
                // Classic global selection
                basePrice = parseFloat(filters.priceType === 'custo' ? p.valor_custo : p.valor_venda);
            } else {
                // Dynamic Type Selection
                const valueObj = p.valores?.find(v => v.nome_tipo === filters.priceType);
                if (valueObj) {
                    basePrice = parseFloat(filters.baseValue === 'custo' ? valueObj.valor_custo : valueObj.valor_venda);
                } else {
                    // Fallback to standard if type not found for this product
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
    }, [products, filters.nome, filters.somenteComEstoque, markup]);

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
        setTimeout(() => {
            window.print();
        }, 500);
    };



    return (
        <div className="space-y-6">
            {/* Print Header */}
            {/* Print Header */}
            <div className="hidden print:block mb-6 font-sans">
                <style type="text/css" media="print">
                    {`
                        @page {
                            size: portrait;
                            margin: 10mm;
                        }
                        @media print {
                            body { -webkit-print-color-adjust: exact; }
                            table { font-size: 10px; }
                            td, th { padding: 4px !important; }
                        }
                    `}
                </style>

                <div className="flex items-center justify-between border-b pb-4 mb-4">
                    {/* Left: Logo/Name */}
                    <div className="flex flex-col">
                        <span className="text-3xl font-bold tracking-tight text-[#E81D88]">Icore System</span>
                        <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">Sistema de Gestão</span>
                    </div>
                    {/* Right: Company Details */}
                    <div className="text-right text-xs space-y-1.5 text-gray-600">
                        <p><span className="font-bold text-gray-800">CNPJ:</span> 58.499.151/0001-16</p>
                        <p><span className="font-bold text-gray-800">Email:</span> antoniosilva286mv1@gmail.com</p>
                        <p><span className="font-bold text-gray-800">Tel:</span> (88) 98171-2559</p>
                    </div>
                </div>

                {/* Full width Address */}
                <div className="text-center text-[10px] text-gray-500 mb-8 uppercase tracking-wide">
                    Rua Afonso Ribeiro, 436 - Centro, 733 - Missão Velha (CE) - CEP: 63200-000
                </div>

                {/* Report Title */}
                <div className="text-center space-y-2 mb-6">
                    <h1 className="text-2xl font-bold uppercase tracking-wide inline-block px-8 pb-2 border-b-2 border-[#E81D88]">
                        Tabela de Revenda
                    </h1>
                </div>

                {/* Print Context Info */}
                {(filters.nome || (filters.grupo && filters.grupo !== 'all')) && (
                    <div className="mb-6 p-3 border border-gray-200 rounded-lg bg-gray-50 text-xs flex flex-wrap justify-center gap-x-6 gap-y-2">
                        {filters.nome && <span>Busca: <strong>{filters.nome}</strong></span>}
                        {filters.grupo && filters.grupo !== 'all' && <span>Categoria: <strong>{groups.find(g => String(g.id) === filters.grupo)?.nome || filters.grupo}</strong></span>}
                    </div>
                )}
            </div>

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
                    </div>
                    <div className="mt-4">
                        <Button onClick={fetchAllProducts} disabled={loading} className="w-full md:w-auto">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Atualizar Lista
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="print-shadow-none border-none shadow-none">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {availableColumns.filter(c => c.visible).map(col => (
                                    <TableHead key={col.id} className="text-black font-bold">
                                        {col.label}
                                    </TableHead>
                                ))}
                                {showVerificationColumn && <TableHead className="text-center print:table-cell hidden font-bold">Conf.</TableHead>}
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
                                    <TableRow key={product.id} className="break-inside-avoid">
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
                                                    // Hide complex object if someone enables it, or map to count
                                                    <span className="text-xs">{product.valores?.length || 0} tipos</span>
                                                ) : (
                                                    (product as any)[col.id]
                                                )}
                                            </TableCell>
                                        ))}
                                        {showVerificationColumn && (
                                            <TableCell className="text-center print:table-cell hidden border-l border-gray-300">
                                                <div className="inline-block w-4 h-4 border border-black rounded-sm"></div>
                                            </TableCell>
                                        )}
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
                <div className="mt-4 text-right font-bold print:mr-4 print:block hidden">
                    Total de itens: {filteredAndCalculatedProducts.length}
                </div>
            </Card>

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
                        <Button onClick={confirmPrint}>Imprimir</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
