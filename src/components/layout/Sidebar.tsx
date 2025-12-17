import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Users, BarChart3, ShoppingBag, Calculator, LogOut, TrendingUp } from 'lucide-react';

export function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
    };

    const menuItems = [
        { icon: BarChart3, label: 'Dashboard', path: '/' },
        { icon: Users, label: 'Clientes', path: '/clientes' },
        { icon: ShoppingBag, label: 'Produtos', path: '/produtos' },
        { icon: TrendingUp, label: 'Vendas', path: '/vendas' },
        { icon: Calculator, label: 'Orçamentos', path: '/revenda' },
    ];

    return (
        <div className="w-64 border-r bg-gradient-to-br from-pink-600 to-purple-800 h-screen flex flex-col shadow-lg transition-all duration-300 no-print text-white">
            <div className="p-6 border-b border-white/10 flex justify-center items-center">
                <img src="/logo.png" alt="Ayla Digital - Sistema de Gestão de relatórios" className="h-12 w-auto object-contain hover:scale-105 transition-transform brightness-0 invert" />
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Button
                            key={item.path}
                            variant={isActive ? 'secondary' : 'ghost'}
                            className={cn(
                                'w-full justify-start gap-3 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-white text-pink-700 shadow-sm pl-3'
                                    : 'text-pink-100 hover:text-white hover:bg-white/10'
                            )}
                            asChild
                        >
                            <Link to={item.path}>
                                <item.icon className={cn("h-4 w-4", isActive ? "text-pink-700" : "text-pink-200")} />
                                {item.label}
                            </Link>
                        </Button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10">
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start gap-3 text-sm font-medium text-pink-100 hover:text-white hover:bg-white/10"
                >
                    <LogOut className="h-4 w-4" />
                    SAIR
                </Button>
            </div>
        </div>
    );
}
