import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Plus, Trash, Printer, Download, UserPlus, ArrowRight, ArrowLeft, Settings } from 'lucide-react';
import { clientsService, type Client } from '@/services/api/clients';
import { productService, type Product } from '@/services/api/products';
import { toast } from 'sonner';
import { addCompanyHeader } from '@/lib/reportUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface QuoteItem {
    product: Product;
    quantity: number;
    percentage: number;
    unitPrice: number;
    total: number;
}

export default function QuotesClient() {
    const [clients, setClients] = useState<Client[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Steps: 1 = Client Selection, 2 = Product Selection
    const [step, setStep] = useState(1);

    // Step 1: Client Selection
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientSearch, setClientSearch] = useState('');
    const [isNewClientOpen, setIsNewClientOpen] = useState(false);
    const [newClientData, setNewClientData] = useState({ nome: '', cpf_cnpj: '', email: '', telefone: '' });

    // Step 2: Quote Building
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productSearch, setProductSearch] = useState('');
    const [quantity, setQuantity] = useState<number>(1);
    const [percentage, setPercentage] = useState<number>(0);
    const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);

    // Column Customization
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const [availableColumns, setAvailableColumns] = useState([
        { id: 'codigo', label: 'Cód.', visible: false },
        { id: 'produto', label: 'Produto', visible: true },
        { id: 'estoque', label: 'Estoque', visible: false },
        { id: 'custo', label: 'V. Custo', visible: false },
        { id: 'venda_base', label: 'V. Venda', visible: false },
        { id: 'quantidade', label: 'Qtd', visible: true },
        { id: 'percentage', label: '%', visible: true },
        { id: 'valor_porcentagem', label: 'Valor %', visible: false },
        { id: 'unitPrice', label: 'V. Final', visible: true },
        { id: 'total', label: 'Total', visible: true },
    ]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [clientsData, productsData] = await Promise.all([
                clientsService.getAll(1, 1000),
                productService.getAll(1, 1000)
            ]);
            // Safe access to data property
            setClients((clientsData as any).data || []);
            setProducts((productsData as any).data || []);
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Erro ao carregar dados.");
        }
    };

    const handleAddProduct = () => {
        if (!selectedProduct) return;

        const unitCost = Number(selectedProduct.valor_venda) || 0;
        // Logic for percentage: adding percentage to unit price? 
        // Or is it a discount? "Porcentagem" usually implies discount or margin.
        // Given "Orçamento personalizado" and "Opções sobre os produtos", likely Markup or Discount.
        // I will assume it is a Markup for now, or just an adjustment field. 
        // Let's implement as: Price = UnitPrice + (UnitPrice * Percentage / 100)
        // If user enters negative, it's discount.

        const adjustedPrice = Math.ceil(unitCost + (unitCost * percentage / 100));
        const total = adjustedPrice * quantity;

        const newItem: QuoteItem = {
            product: selectedProduct,
            quantity,
            percentage,
            unitPrice: adjustedPrice,
            total
        };

        setQuoteItems([...quoteItems, newItem]);
        setSelectedProduct(null);
        setQuantity(1);
        setPercentage(0);
        setProductSearch('');
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...quoteItems];
        newItems.splice(index, 1);
        setQuoteItems(newItems);
    };

    const handleCreateClient = async () => {
        try {
            const created = await clientsService.create(newClientData);
            toast.success("Cliente cadastrado com sucesso!");
            // Fix: handle potential type mismatch or single object return
            const newClient = created as unknown as Client;
            setClients([...clients, newClient]);
            setSelectedClient(newClient);
            setIsNewClientOpen(false);
            setNewClientData({ nome: '', cpf_cnpj: '', email: '', telefone: '' });
        } catch (error) {
            console.error(error);
            toast.error("Erro ao cadastrar cliente.");
        }
    };

    const calculateTotal = () => {
        return quoteItems.reduce((acc, item) => acc + item.total, 0);
    };

    const toggleColumn = (id: string) => {
        setAvailableColumns(prev => prev.map(col =>
            col.id === id ? { ...col, visible: !col.visible } : col
        ));
    };

    const exportPDF = () => {
        // Allow export without client
        const clientName = selectedClient ? selectedClient.nome : 'Cliente Não Informado / Consumidor';

        const doc = new jsPDF();
        addCompanyHeader(doc, 'Orçamento Personalizado');

        doc.setFontSize(12);
        doc.text(`Cliente: ${clientName}`, 14, 55);
        doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 62);

        const visibleCols = availableColumns.filter(c => c.visible);
        const head = [visibleCols.map(c => c.label)];
        const body = quoteItems.map(item => {
            const row: any[] = [];
            const basePrice = Number(item.product.valor_venda);
            const percentValue = item.unitPrice - basePrice;

            if (availableColumns.find(c => c.id === 'codigo')?.visible) row.push(item.product.codigo_interno || '-');
            if (availableColumns.find(c => c.id === 'produto')?.visible) row.push(item.product.nome);
            if (availableColumns.find(c => c.id === 'estoque')?.visible) row.push(item.product.estoque);
            if (availableColumns.find(c => c.id === 'custo')?.visible) row.push(Number(item.product.valor_custo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
            if (availableColumns.find(c => c.id === 'venda_base')?.visible) row.push(basePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
            if (availableColumns.find(c => c.id === 'quantidade')?.visible) row.push(item.quantity);
            if (availableColumns.find(c => c.id === 'percentage')?.visible) row.push(`${item.percentage}%`);
            if (availableColumns.find(c => c.id === 'valor_porcentagem')?.visible) row.push(percentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
            if (availableColumns.find(c => c.id === 'unitPrice')?.visible) row.push(item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
            if (availableColumns.find(c => c.id === 'total')?.visible) row.push(item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
            return row;
        });

        autoTable(doc, {
            startY: 70,
            head: head,
            body: body,
            styles: { fontSize: 8 }, // Smaller font if many columns
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.text(`Total Geral: ${calculateTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 14, finalY);

        doc.save('orcamento.pdf');
    };

    const filterClients = clients.filter(c => c.nome.toLowerCase().includes(clientSearch.toLowerCase()));
    const filterProducts = products.filter(p => p.nome.toLowerCase().includes(productSearch.toLowerCase()));

    // Company Data for Print
    const COMPANY_DATA = {
        name: "Icore System",
        cnpj: "58.499.151/0001-16",
        email: "antoniosilva286mv1@gmail.com",
        phone: "(88) 98171-2559",
        address1: "RUA AFONSO RIBEIRO, 436",
        address2: "CENTRO, 733 - Missão Velha (CE)"
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <style>{`
                @media print {
                    @page { size: landscape; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>
            {/* Header */}
            <div className="flex justify-between items-center no-print">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Novo Orçamento {step === 2 && "- Produtos"}
                </h1>

                {step === 2 && (
                    <div className="flex gap-2">
                        <Button onClick={() => setIsColumnModalOpen(true)} variant="outline">
                            <Settings className="h-4 w-4 mr-2" />
                            Colunas
                        </Button>
                        <Button onClick={exportPDF} variant="outline" className="gap-2">
                            <Download className="h-4 w-4" />
                            PDF
                        </Button>
                        <Button onClick={() => window.print()} className="gap-2">
                            <Printer className="h-4 w-4" />
                            Imprimir
                        </Button>
                    </div>
                )}
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-6 border-b pb-4">
                <div className="flex justify-between items-start mb-4">
                    <div className="text-left">
                        <h1 className="text-2xl font-bold text-gray-900">{COMPANY_DATA.name}</h1>
                        <p className="text-sm text-gray-600">CNPJ: {COMPANY_DATA.cnpj}</p>
                        <p className="text-sm text-gray-600">Email: {COMPANY_DATA.email}</p>
                        <p className="text-sm text-gray-600">Tel: {COMPANY_DATA.phone}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">{COMPANY_DATA.address1}</p>
                        <p className="text-sm text-gray-600">{COMPANY_DATA.address2}</p>
                    </div>
                </div>
                <div className="text-center font-bold text-xl uppercase tracking-wide bg-gray-100 py-2 rounded-sm">
                    Orçamento Personalizado
                </div>
                <div className="mt-4 flex justify-between">
                    <p><strong>Cliente:</strong> {selectedClient ? selectedClient.nome : 'Cliente Não Informado / Consumidor'}</p>
                    <p><strong>Data:</strong> {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Step 1: Client Selection */}
            {step === 1 && (
                <div className="max-w-4xl mx-auto">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                Selecione o Cliente
                                <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                            <UserPlus className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Novo Cliente</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Nome</Label>
                                                <Input
                                                    value={newClientData.nome}
                                                    onChange={e => setNewClientData({ ...newClientData, nome: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>CPF/CNPJ</Label>
                                                <Input
                                                    value={newClientData.cpf_cnpj}
                                                    onChange={e => setNewClientData({ ...newClientData, cpf_cnpj: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Email</Label>
                                                <Input
                                                    value={newClientData.email}
                                                    onChange={e => setNewClientData({ ...newClientData, email: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Telefone</Label>
                                                <Input
                                                    value={newClientData.telefone}
                                                    onChange={e => setNewClientData({ ...newClientData, telefone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleCreateClient}>Salvar</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar cliente..."
                                        className="pl-8"
                                        value={clientSearch}
                                        onChange={(e) => setClientSearch(e.target.value)}
                                    />
                                </div>
                                <div className="h-[300px] overflow-y-auto border rounded-md p-2 space-y-1">
                                    {filterClients.map(client => (
                                        <div
                                            key={client.id}
                                            className={`p-3 rounded-md cursor-pointer transition-colors flex justify-between items-center ${selectedClient?.id === client.id
                                                ? 'bg-primary/10 ring-1 ring-primary'
                                                : 'hover:bg-accent'
                                                }`}
                                            onClick={() => setSelectedClient(client)}
                                        >
                                            <div>
                                                <div className="font-medium">{client.nome}</div>
                                                <div className="text-xs text-muted-foreground">{client.cpf_cnpj}</div>
                                            </div>
                                            {selectedClient?.id === client.id && (
                                                <div className="text-sm font-semibold text-primary">Selecionado</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-6 flex justify-between">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedClient(null);
                                        setStep(2);
                                    }}
                                >
                                    Não informar cliente
                                </Button>
                                <Button
                                    onClick={() => setStep(2)}
                                    disabled={!selectedClient}
                                >
                                    Avançar <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Step 2: Product & Quote */}
            {step === 2 && (
                <div className="grid grid-cols-1 gap-6">
                    <Card className="shadow-lg no-print">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                Itens do Orçamento
                                <Button variant="ghost" onClick={() => setStep(1)} className="text-sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Alterar Cliente
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {selectedClient ? (
                                <div className="bg-muted p-3 rounded-md border text-sm mb-4">
                                    <strong>Cliente:</strong> {selectedClient.nome} ({selectedClient.cpf_cnpj || 'Sem CPF/CNPJ'})
                                </div>
                            ) : (
                                <div className="bg-muted p-3 rounded-md border text-sm mb-4">
                                    <strong>Cliente:</strong> Não informado
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1 space-y-2 min-w-[200px] relative">
                                    <Label>Produto</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar produto..."
                                            className="pl-8"
                                            value={productSearch}
                                            onChange={(e) => {
                                                setProductSearch(e.target.value);
                                                if (selectedProduct && e.target.value !== selectedProduct.nome) {
                                                    setSelectedProduct(null);
                                                }
                                            }}
                                        />
                                        {productSearch && !selectedProduct && (
                                            <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                {filterProducts.map(product => (
                                                    <div
                                                        key={product.id}
                                                        className="p-2 hover:bg-accent cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedProduct(product);
                                                            setProductSearch(product.nome);
                                                        }}
                                                    >
                                                        <div className="font-medium">{product.nome}</div>
                                                        <div className="text-xs text-muted-foreground">R$ {product.valor_venda}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="w-24 space-y-2">
                                    <Label>Qtd</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        placeholder="1"
                                    />
                                </div>
                                <div className="w-24 space-y-2">
                                    <Label>%</Label>
                                    <Input
                                        type="number"
                                        value={percentage}
                                        onChange={(e) => setPercentage(Number(e.target.value))}
                                        placeholder="0"
                                    />
                                </div>
                                <Button
                                    onClick={handleAddProduct}
                                    disabled={!selectedProduct}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        {availableColumns.filter(c => c.visible).map(col => (
                                            <TableHead key={col.id} className={col.id === 'total' ? 'text-right' : ''}>
                                                {col.label}
                                            </TableHead>
                                        ))}
                                        <TableHead className="w-[50px] no-print"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quoteItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={availableColumns.filter(c => c.visible).length + 1} className="text-center py-8 text-muted-foreground">
                                                Nenhum item adicionado
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        quoteItems.map((item, index) => {
                                            const basePrice = Number(item.product.valor_venda);
                                            const percentValue = item.unitPrice - basePrice;

                                            return (
                                                <TableRow key={index}>
                                                    {availableColumns.filter(c => c.visible).map(col => {
                                                        if (col.id === 'codigo') return <TableCell key={col.id}>{item.product.codigo_interno || '-'}</TableCell>;
                                                        if (col.id === 'produto') return <TableCell key={col.id} className="font-medium">{item.product.nome}</TableCell>;
                                                        if (col.id === 'estoque') return <TableCell key={col.id}>{item.product.estoque}</TableCell>;
                                                        if (col.id === 'custo') return <TableCell key={col.id}>{Number(item.product.valor_custo || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>;
                                                        if (col.id === 'venda_base') return <TableCell key={col.id}>{basePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>;
                                                        if (col.id === 'quantidade') return <TableCell key={col.id}>{item.quantity}</TableCell>;
                                                        if (col.id === 'percentage') return <TableCell key={col.id}>{item.percentage}%</TableCell>;
                                                        if (col.id === 'valor_porcentagem') return <TableCell key={col.id}>{percentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>;
                                                        if (col.id === 'unitPrice') return <TableCell key={col.id}>{item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>;
                                                        if (col.id === 'total') return <TableCell key={col.id} className="text-right font-bold text-green-600">{item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>;
                                                        return null;
                                                    })}
                                                    <TableCell className="no-print">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => handleRemoveItem(index)}
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                        <div className="p-4 border-t bg-gray-50 flex justify-end">
                            <div className="text-right">
                                <span className="text-muted-foreground mr-4">Total Geral:</span>
                                <span className="text-2xl font-bold text-primary">
                                    {calculateTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

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
        </div>
    );
}
