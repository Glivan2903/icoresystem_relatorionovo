import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { clientsService, type Client, type ClientDetail } from '@/services/api/clients';
import { Loader2, Printer, Eye, Settings } from 'lucide-react';
import { toast } from 'sonner';

export function ClientsReport() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        nome: '',
        cpf_cnpj: '',
        email: ''
    });

    // Column Selection State
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const [availableColumns, setAvailableColumns] = useState([
        { id: 'id', label: 'ID', visible: true },
        { id: 'nome', label: 'Nome', visible: true },
        { id: 'email', label: 'Email', visible: false },
        { id: 'telefone', label: 'Telefone', visible: true },
        { id: 'cpf_cnpj', label: 'CPF / CNPJ', visible: true },
    ]);

    // Detail Modal State
    const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const response = await clientsService.getAll(1, 1000); // Fetch large batch
            setClients(response.data || []);

            if ((response.data || []).length === 0) {
                toast.info('Nenhum cliente encontrado.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao buscar clientes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handlePrint = async () => {
        const toastId = toast.loading('Preparando impressão (buscando registros)...');
        try {
            // Fetch first page
            const response = await clientsService.getAll(1, 100);
            let allData = response.data || [];

            if (response.meta && response.meta.total_paginas > 1) {
                const totalPages = response.meta.total_paginas;
                for (let p = 2; p <= totalPages; p++) {
                    toast.loading(`Carregando página ${p} de ${totalPages}...`, { id: toastId });
                    await new Promise(r => setTimeout(r, 350));
                    const nextRes = await clientsService.getAll(p, 100);
                    if (nextRes.data) {
                        allData = [...allData, ...nextRes.data];
                    }
                }
            }

            if (allData.length > 0) {
                setClients(allData);
                // Wait for render
                await new Promise(resolve => setTimeout(resolve, 1000));

                toast.dismiss(toastId);
                window.print();
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao preparar impressão");
        } finally {
            fetchClients();
        }
    };

    const handleViewDetails = async (id: string) => {
        setIsDetailModalOpen(true);
        try {
            const clientDetails = await clientsService.getById(id);
            setSelectedClient(clientDetails);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar detalhes do cliente.');
            setIsDetailModalOpen(false);
        }
    };

    const toggleColumn = (id: string) => {
        setAvailableColumns(prev => prev.map(col =>
            col.id === id ? { ...col, visible: !col.visible } : col
        ));
    };

    const filteredClients = clients.filter(client => {
        const matchNome = filters.nome ? client.nome.toLowerCase().includes(filters.nome.toLowerCase()) : true;
        const matchCpf = filters.cpf_cnpj ? (client.cpf_cnpj && client.cpf_cnpj.includes(filters.cpf_cnpj)) : true;
        const matchEmail = filters.email ? (client.email && client.email.toLowerCase().includes(filters.email.toLowerCase())) : true;
        return matchNome && matchCpf && matchEmail;
    });



    return (
        <div className="space-y-6">
            {/* Print Header - Visible only when printing */}
            <div className="hidden print:block mb-8">
                <style type="text/css" media="print">
                    {`
                        @page { 
                        @page {
                            size: landscape;
                            margin: 10mm;
                        }
                    `}
                </style>
                <div className="text-center font-bold text-2xl mb-4">Icore System</div>
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
                <div className="text-center font-bold text-xl uppercase mb-6">Relatório de Clientes</div>
            </div>

            <div className="flex items-center justify-between no-print">
                <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                <div className="flex gap-2">
                    <Button onClick={() => setIsColumnModalOpen(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Colunas
                    </Button>
                    <Button onClick={handlePrint} className="gap-2">
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
                        <label className="text-sm font-medium">Nome</label>
                        <Input
                            value={filters.nome}
                            onChange={(e) => setFilters(prev => ({ ...prev, nome: e.target.value }))}
                            placeholder="Buscar por nome..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">CPF / CNPJ</label>
                        <Input
                            value={filters.cpf_cnpj}
                            onChange={(e) => setFilters(prev => ({ ...prev, cpf_cnpj: e.target.value }))}
                            placeholder="Buscar por documento..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            value={filters.email}
                            onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Buscar por email..."
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="print-shadow-none border-none shadow-none">
                <CardHeader className="print-hidden px-0">
                    <CardTitle>Listagem de Clientes</CardTitle>
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
                                <TableHead className="text-right no-print">Ações</TableHead>
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
                                filteredClients.map((client) => (
                                    <TableRow key={client.id} className="break-inside-avoid">
                                        {availableColumns.filter(c => c.visible).map(col => (
                                            <TableCell key={col.id} className="align-top py-2">
                                                {(client as any)[col.id] || '-'}
                                            </TableCell>
                                        ))}
                                        <TableCell className="text-right no-print align-top">
                                            <Button variant="ghost" size="icon" onClick={() => handleViewDetails(String(client.id))}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                            {filteredClients.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={availableColumns.filter(c => c.visible).length + 1} className="text-center py-8 text-muted-foreground">
                                        Nenhum cliente encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <div className="mt-4 text-right font-bold print:mr-4 print:block hidden">
                    Total de clientes: {filteredClients.length}
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

            {/* Client Detail Modal */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto no-print">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Cliente</DialogTitle>
                        <DialogDescription>Informações completas do cadastro.</DialogDescription>
                    </DialogHeader>
                    {selectedClient ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div><span className="font-bold">ID:</span> {selectedClient.id}</div>
                                <div><span className="font-bold">Nome:</span> {selectedClient.nome}</div>
                                <div><span className="font-bold">CPF/CNPJ:</span> {selectedClient.cpf_cnpj || '-'}</div>
                                <div><span className="font-bold">Email:</span> {selectedClient.email || '-'}</div>
                                <div><span className="font-bold">Celular:</span> {selectedClient.celular || '-'}</div>
                                <div><span className="font-bold">Telefone:</span> {selectedClient.telefone || '-'}</div>
                            </div>

                            {selectedClient.enderecos && selectedClient.enderecos.length > 0 && (
                                <div className="border-t pt-4">
                                    <h3 className="font-semibold mb-2">Endereço</h3>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                        {selectedClient.enderecos[0].endereco?.logradouro}, {selectedClient.enderecos[0].endereco?.numero} - {selectedClient.enderecos[0].endereco?.bairro}, {selectedClient.enderecos[0].endereco?.nome_cidade} - {selectedClient.enderecos[0].endereco?.estado}
                                    </p>
                                </div>
                            )}

                            {selectedClient.obs && (
                                <div className="border-t pt-4">
                                    <h3 className="font-semibold mb-2">Observações</h3>
                                    <p className="text-sm text-gray-700">{selectedClient.obs}</p>
                                </div>
                            )}
                        </div>
                    ) : null}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default ClientsReport;
