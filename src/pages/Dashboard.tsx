import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { productService } from '@/services/api/products';
import { quotesService } from '@/services/api/quotes';
import { salesService } from '@/services/api/sales';


import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingBag, FileText, TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        products: 0,
        quotes: 0,
        salesCount: 0
    });

    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [topClients, setTopClients] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, quotesRes, salesRes] = await Promise.all([
                    productService.getAll(1, 1), // Get total from meta
                    quotesService.getAll(undefined, undefined, 1),
                    // Fetching a large batch of sales to calculate top products client-side
                    // The API allows pagination, using a high limit to get substantial data for stats
                    salesService.getAll(undefined, undefined, 1, 1000)
                ]);

                setStats({
                    products: productsRes.meta.total_registros,
                    quotes: quotesRes.meta.total_registros,
                    salesCount: salesRes.meta.total_registros
                });

                // Process Sales Data for Top Products Chart
                const salesData = salesRes.data || [];
                const productSalesMap = new Map<string, number>();

                salesData.forEach(sale => {
                    sale.produtos.forEach(item => {
                        const productName = item.produto.nome_produto || 'Produto Desconhecido';
                        // Using total value for ranking, could also be quantity
                        const value = parseFloat(item.produto.valor_total);
                        const currentTotal = productSalesMap.get(productName) || 0;
                        productSalesMap.set(productName, currentTotal + value);
                    });
                });

                // Convert map to array and sort
                const sortedProducts = Array.from(productSalesMap.entries())
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5); // Top 5

                setTopProducts(sortedProducts.length > 0 ? sortedProducts : []);

                // Process Sales Data for Top Clients Ranking
                const clientSalesMap = new Map<string, { id: string, name: string, quantity: number, totalSpent: number }>();

                salesData.forEach(sale => {
                    const clientId = sale.cliente_id;
                    const clientName = sale.nome_cliente || 'Desconhecido';

                    let saleQuantity = 0;
                    let saleTotal = 0;
                    sale.produtos.forEach(item => {
                        saleQuantity += parseFloat(item.produto.quantidade);
                        saleTotal += parseFloat(item.produto.valor_total);
                    });

                    const current = clientSalesMap.get(clientId) || { id: clientId, name: clientName, quantity: 0, totalSpent: 0 };
                    current.quantity += saleQuantity;
                    current.totalSpent += saleTotal;
                    clientSalesMap.set(clientId, current);
                });

                const sortedClients = Array.from(clientSalesMap.values())
                    .sort((a, b) => b.quantity - a.quantity)
                    .slice(0, 10);

                setTopClients(sortedClients);

            } catch (error) {
                console.error(error);
                toast.error('Erro ao carregar dados do dashboard.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.products}</div>
                        <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Orçamentos</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.quotes}</div>
                        <p className="text-xs text-muted-foreground">Total emitidos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vendas Realizadas</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.salesCount}</div>
                        <p className="text-xs text-muted-foreground">Total de pedidos</p>
                    </CardContent>
                </Card>

            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-7">
                    <CardHeader>
                        <CardTitle>Produtos Mais Vendidos</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topProducts}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Top 10 Clientes (Quantidade de Produtos)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">ID</TableHead>
                                    <TableHead>Nome do Cliente</TableHead>
                                    <TableHead className="text-right">Qtd. Produtos</TableHead>
                                    <TableHead className="text-right">Receita Gerada</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topClients.length > 0 ? (
                                    topClients.map(client => (
                                        <TableRow key={client.id}>
                                            <TableCell className="font-medium">{client.id}</TableCell>
                                            <TableCell>{client.name}</TableCell>
                                            <TableCell className="text-right font-bold">{client.quantity}</TableCell>
                                            <TableCell className="text-right text-green-600 font-bold">
                                                {client.totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                                            Sem dados de compras recentes.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
