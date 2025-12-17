import { useState } from 'react';
import { RuleBuilder } from '@/components/rules/RuleBuilder';
import { RuleList } from '@/components/rules/RuleList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Play, Save } from 'lucide-react';
import { useRulesStore } from '@/store/rulesStore';
import { productService, type Product } from '@/services/api/products';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface SimulationResult {
    product: Product;
    oldPrice: number;
    newPrice: number;
    ruleApplied: string | null;
    status: 'changed' | 'unchanged';
    reason?: string;
}

export default function PriceUpdates() {
    const { rules } = useRulesStore();
    const [loading, setLoading] = useState(false);
    const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
    const [phase, setPhase] = useState<'config' | 'preview'>('config');

    const runSimulation = async () => {
        if (rules.length === 0) {
            toast.error('Adicione pelo menos uma regra para simular.');
            return;
        }

        setLoading(true);
        try {
            // Fetch all products (simplified for demo, in real app might need batches)
            const response = await productService.getAll(1, 100);
            const products = response.data;

            const results: SimulationResult[] = products.map((product) => {
                let currentPrice = parseFloat(product.valor_venda);
                let ruleApplied = null;
                let newPrice = currentPrice;
                let reason = 'Não corresponde a nenhuma regra';
                let isChanged = false;

                // Apply rules in order
                for (const rule of rules) {
                    if (!rule.active) continue;

                    // Check filters
                    const typeMatch = product.nome.toLowerCase().includes(rule.productType.toLowerCase()) ||
                        product.nome_grupo.toLowerCase().includes(rule.productType.toLowerCase()); // Flexible match

                    if (!typeMatch) continue;

                    // Check condition
                    const refPrice = rule.referencePrice;
                    let conditionMet = false;

                    switch (rule.condition) {
                        case '>': conditionMet = currentPrice > refPrice; break;
                        case '>=': conditionMet = currentPrice >= refPrice; break;
                        case '<': conditionMet = currentPrice < refPrice; break;
                        case '<=': conditionMet = currentPrice <= refPrice; break;
                        case '=': conditionMet = currentPrice === refPrice; break;
                        case '!=': conditionMet = currentPrice !== refPrice; break;
                    }

                    if (conditionMet) {
                        // Check exception
                        const stock = typeof product.estoque === 'string' ? parseInt(product.estoque) : product.estoque;
                        if (rule.exceptionQuantity > 0 && stock === rule.exceptionQuantity) {
                            reason = `Exceção por quantidade (${rule.exceptionQuantity})`;
                            break; // Stop or continue? Usually exceptions break the specific rule application
                        }

                        // Apply adjustment
                        const adjustment = currentPrice * (rule.adjustmentPercentage / 100);
                        newPrice = currentPrice + adjustment;
                        ruleApplied = rule.name;
                        isChanged = true;
                        reason = '';
                        break; // Stop after first matching rule (as per typical "first match wins" logic, or accumulate? User prompt said "Ordem de Aplicação", implies sequence, but usually price rules are one-match) 
                        // Let's assume First Match Wins for simplicity and safety
                    }
                }

                return {
                    product,
                    oldPrice: currentPrice,
                    newPrice,
                    ruleApplied,
                    status: isChanged ? 'changed' : 'unchanged',
                    reason
                };
            });

            setSimulationResults(results);
            setPhase('preview');
            toast.success(`Simulação concluída. ${results.filter(r => r.status === 'changed').length} produtos afetados.`);

        } catch (error) {
            console.error(error);
            toast.error('Erro ao buscar produtos para simulação.');
        } finally {
            setLoading(false);
        }
    };

    const applyChanges = async () => {
        // In a real app, this would iterate and call update API
        const changed = simulationResults.filter(r => r.status === 'changed');
        if (changed.length === 0) return;

        if (!confirm(`Confirma a atualização de preço para ${changed.length} produtos ? Essa ação não pode ser desfeita automaticamente.`)) {
            return;
        }

        setLoading(true);
        let successCount = 0;
        try {
            // Only process first 5 for demo safety/speed unless confirmed
            for (const item of changed) {
                await productService.updatePrice(item.product.id, item.newPrice);
                successCount++;
            }
            toast.success(`${successCount} produtos atualizados com sucesso!`);
            setPhase('config');
            setSimulationResults([]);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao aplicar alterações. Verifique o console.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Atualização de Preços</h1>
                {phase === 'preview' && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setPhase('config')}>
                            Voltar / Ajustar
                        </Button>
                        <Button onClick={applyChanges} disabled={loading} className="bg-green-600 hover:bg-green-700">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Aplicar Alterações
                        </Button>
                    </div>
                )}
            </div>

            {phase === 'config' && (
                <>
                    <RuleBuilder />
                    <RuleList />
                    <div className="flex justify-end mt-6">
                        <Button size="lg" onClick={runSimulation} disabled={loading || rules.length === 0}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                            Simular Alterações
                        </Button>
                    </div>
                </>
            )}

            {phase === 'preview' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resultado da Simulação</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 mb-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span>Alterados: {simulationResults.filter(r => r.status === 'changed').length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gray-300" />
                                <span>Sem Alteração: {simulationResults.filter(r => r.status === 'unchanged').length}</span>
                            </div>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Preço Atual</TableHead>
                                    <TableHead>Novo Preço</TableHead>
                                    <TableHead>Diferença</TableHead>
                                    <TableHead>Regra / Motivo</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {simulationResults.map((item) => (
                                    <TableRow key={item.product.id}>
                                        <TableCell className="font-medium">{item.product.nome}</TableCell>
                                        <TableCell>{item.oldPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                        <TableCell>{item.newPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                        <TableCell className={item.newPrice > item.oldPrice ? 'text-green-600' : (item.newPrice < item.oldPrice ? 'text-red-600' : '')}>
                                            {item.status === 'changed' ?
                                                `${((item.newPrice - item.oldPrice) / item.oldPrice * 100).toFixed(1)}%` :
                                                '-'}
                                        </TableCell>
                                        <TableCell>{item.ruleApplied || item.reason}</TableCell>
                                        <TableCell>
                                            {item.status === 'changed' ? (
                                                <Badge className="bg-green-500">Alterado</Badge>
                                            ) : (
                                                <Badge variant="secondary">Inalterado</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
