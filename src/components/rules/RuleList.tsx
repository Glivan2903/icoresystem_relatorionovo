import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { useRulesStore } from '@/store/rulesStore';

export function RuleList() {
    const { rules, removeRule, updateRule } = useRulesStore();

    if (rules.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                    Nenhuma regra criada. Adicione uma regra acima para começar.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Regras Ativas ({rules.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {rules.map((rule, index) => (
                    <div
                        key={rule.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-muted-foreground font-mono text-sm w-6">#{index + 1}</span>
                            <div>
                                <div className="font-medium flex items-center gap-2">
                                    {rule.productType}
                                    <Badge variant="outline">{rule.condition} {rule.referencePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Ajuste: <span className={rule.adjustmentPercentage > 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                                        {rule.adjustmentPercentage > 0 ? '+' : ''}{rule.adjustmentPercentage}%
                                    </span>
                                    {rule.exceptionQuantity > 0 && ` • Exceto se estoque = ${rule.exceptionQuantity}`}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Switch
                                checked={rule.active}
                                onCheckedChange={(checked) => updateRule(rule.id, { active: checked })}
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive/90"
                                onClick={() => removeRule(rule.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
