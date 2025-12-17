import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { productService, type Product } from '@/services/api/products';
import { calculateResalePrice } from '@/lib/pricing';
import { Loader2, Calculator, Printer, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function ResaleReport() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [markup, setMarkup] = useState<string>('30'); // Default 30%
    const [selectedGroup, setSelectedGroup] = useState<string>('all');

    // Column Selection State
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const [availableColumns, setAvailableColumns] = useState([
        { id: 'codigo_interno', label: 'Código', visible: true },
        { id: 'nome', label: 'Descrição', visible: true },
        { id: 'valor_venda', label: 'Valor Custo', visible: true },
        { id: 'markup', label: '+ Margem (%)', visible: true },
        { id: 'preco_revenda', label: 'Valor', visible: true },
        { id: 'arredondado', label: 'Obs', visible: true }, // Indicator
    ]);

    // Print Configuration State
    const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
    const [showVerificationColumn, setShowVerificationColumn] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await productService.getAll(1, 1000); // Fetch larger batch for client-side filtering/calc
            setProducts(response.data || []);
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

    // Extract unique groups
    const groups = useMemo(() => {
        const unique = new Set(products.map(p => p.nome_grupo).filter(Boolean));
        return Array.from(unique).sort();
    }, [products]);

    // Filter and Calculate
    const calculatedProducts = useMemo(() => {
        let filtered = products;
        if (selectedGroup !== 'all') {
            filtered = products.filter(p => p.nome_grupo === selectedGroup);
        }

        return filtered.map(p => {
            const basePrice = parseFloat(p.valor_venda);
            const percentage = parseFloat(markup) || 0;
            const finalPrice = calculateResalePrice(basePrice, percentage);

            return {
                ...p,
                percentual_aplicado: percentage,
                preco_revenda: finalPrice
            };
        });
    }, [products, selectedGroup, markup]);

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
                <div className="text-center font-bold text-xl uppercase mb-2">Orçamentos</div>

                {/* Print Context Info */}
                <div className="mb-4 p-2 border rounded bg-gray-50 text-sm flex justify-center gap-6">
                    <span>Categoria: <strong>{selectedGroup === 'all' ? 'Todas' : selectedGroup}</strong></span>
                    <span>Margem Aplicada: <strong>{markup}%</strong></span>
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
                                        <SelectItem key={g} value={g}>{g}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full md:w-1/4 space-y-2">
                            <label className="text-sm font-medium">Porcentagem de Margem (%)</label>
                            <div className="relative">
                                <Calculator className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    value={markup}
                                    onChange={(e) => setMarkup(e.target.value)}
                                    className="pl-8"
                                />
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
                                    {isColVisible('valor_venda') && <TableHead className="text-black font-bold">Valor Custo</TableHead>}
                                    {isColVisible('markup') && <TableHead className="text-black font-bold">+ Margem (%)</TableHead>}
                                    {isColVisible('preco_revenda') && <TableHead className="text-black font-bold text-green-700">Valor</TableHead>}
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
                                            {isColVisible('valor_venda') && <TableCell>{parseFloat(product.valor_venda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>}
                                            {isColVisible('markup') && <TableCell>{markup}%</TableCell>}
                                            {isColVisible('preco_revenda') && (
                                                <TableCell className="font-bold text-lg text-green-700">
                                                    {product.preco_revenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
                    Total de itens: {calculatedProducts.length}
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
