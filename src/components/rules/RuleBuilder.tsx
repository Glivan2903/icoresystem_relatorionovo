import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useRulesStore, type PriceRule, type Condition } from '@/store/rulesStore';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function RuleBuilder() {
    const addRule = useRulesStore((state) => state.addRule);

    const [productType, setProductType] = useState('');
    const [referencePrice, setReferencePrice] = useState('');
    const [condition, setCondition] = useState<Condition>('>');
    const [percentage, setPercentage] = useState('');
    const [exceptionQty, setExceptionQty] = useState('0');

    const handleAddRule = () => {
        if (!productType || !referencePrice || !percentage) {
            toast.error('Preencha os campos obrigatórios (Tipo, Valor, Porcentagem)');
            return;
        }

        const newRule: PriceRule = {
            id: uuidv4(),
            name: `Regra ${productType} ${condition} ${referencePrice}`,
            productType,
            referencePrice: parseFloat(referencePrice),
            condition,
            adjustmentPercentage: parseFloat(percentage),
            exceptionQuantity: parseInt(exceptionQty) || 0,
            active: true,
        };

        addRule(newRule);
        toast.success('Regra adicionada com sucesso!');

        // Reset form
        setProductType('');
        setReferencePrice('');
        setPercentage('');
        setExceptionQty('0');
    };

    return (
        <Card className="mb-6">
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    {/* Quadrado 1 - Tipo */}
                    <div className="space-y-2 col-span-1 md:col-span-2">
                        <label className="text-sm font-medium">1. Tipo do Produto</label>
                        <Input
                            placeholder="Ex: Frontal"
                            value={productType}
                            onChange={(e) => setProductType(e.target.value)}
                        />
                    </div>

                    {/* Quadrado 2 - Valor Ref */}
                    <div className="space-y-2 col-span-1">
                        <label className="text-sm font-medium">2. Valor Ref. (R$)</label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={referencePrice}
                            onChange={(e) => setReferencePrice(e.target.value)}
                        />
                    </div>

                    {/* Quadrado 3 - Condição */}
                    <div className="space-y-2 col-span-1">
                        <label className="text-sm font-medium">3. Condição</label>
                        <Select value={condition} onValueChange={(v) => setCondition(v as Condition)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value=">">Maior {'>'}</SelectItem>
                                <SelectItem value=">=">Maior Igual {'>='}</SelectItem>
                                <SelectItem value="<">Menor {'<'}</SelectItem>
                                <SelectItem value="<=">Menor Igual {'<='}</SelectItem>
                                <SelectItem value="=">Igual {'='}</SelectItem>
                                <SelectItem value="!=">Diferente {'!='}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Quadrado 4 - Porcentagem */}
                    <div className="space-y-2 col-span-1">
                        <label className="text-sm font-medium">4. Ajuste (%)</label>
                        <Input
                            type="number"
                            placeholder="0%"
                            value={percentage}
                            onChange={(e) => setPercentage(e.target.value)}
                        />
                        <span className="text-xs text-muted-foreground">Positivo/Negativo</span>
                    </div>

                    {/* Quadrado 5 - Exceção */}
                    <div className="space-y-2 col-span-1">
                        <label className="text-sm font-medium">5. Exceção Qtd.</label>
                        <Input
                            type="number"
                            placeholder="0"
                            value={exceptionQty}
                            onChange={(e) => setExceptionQty(e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-4 flex justify-end">
                    <Button onClick={handleAddRule} className="w-full md:w-auto">
                        <Plus className="mr-2 h-4 w-4" /> Adicionar Regra
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
