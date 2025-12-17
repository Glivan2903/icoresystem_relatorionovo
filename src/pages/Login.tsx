import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const phrases = [
    "Otimize sua gestão.",
    "Decisões inteligentes.",
    "Relatórios precisos.",
    "Controle total.",
    "Ayla Digital."
];

export default function Login() {
    const [text, setText] = useState('');
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        if (email === import.meta.env.VITE_ADMIN_EMAIL && password === import.meta.env.VITE_ADMIN_PASSWORD) {
            localStorage.setItem('isAuthenticated', 'true');
            toast.success('Login realizado com sucesso!');
            navigate('/');
        } else {
            toast.error('Email ou senha inválidos.');
        }
    };

    useEffect(() => {
        const currentPhrase = phrases[phraseIndex];
        const typeSpeed = isDeleting ? 50 : 100;

        const timeout = setTimeout(() => {
            if (!isDeleting && charIndex < currentPhrase.length) {
                setText(currentPhrase.substring(0, charIndex + 1));
                setCharIndex(charIndex + 1);
            } else if (isDeleting && charIndex > 0) {
                setText(currentPhrase.substring(0, charIndex - 1));
                setCharIndex(charIndex - 1);
            } else if (!isDeleting && charIndex === currentPhrase.length) {
                setTimeout(() => setIsDeleting(true), 2000);
            } else if (isDeleting && charIndex === 0) {
                setIsDeleting(false);
                setPhraseIndex((prev) => (prev + 1) % phrases.length);
            }
        }, typeSpeed);

        return () => clearTimeout(timeout);
    }, [charIndex, isDeleting, phraseIndex]);

    return (
        <div className="flex min-h-screen w-full">
            {/* Left Side - Hero/Typewriter */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-pink-600 to-purple-800 text-white flex-col justify-center items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10" />
                <div className="z-10 text-center space-y-6 max-w-lg p-8">
                    <h1 className="text-5xl font-bold mb-4">Ayla Digital</h1>
                    <div className="h-20 flex items-center justify-center">
                        <span className="text-4xl font-light tracking-wide border-r-4 border-white pr-2 animate-pulse">
                            {text}
                        </span>
                    </div>
                    <p className="text-pink-100 text-lg opacity-90 max-w-md mx-auto leading-relaxed">
                        Sistema de Gestão de Relatórios completo para impulsionar o seu negócio com dados precisos e insights valiosos.
                    </p>
                </div>

                {/* Decorative circles */}
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/4 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex flex-col justify-center items-center bg-gray-50 p-4 sm:p-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Bem-vindo de volta</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Entre com suas credenciais para acessar o painel.
                        </p>
                    </div>

                    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                        <CardHeader className="space-y-1">
                            {/* Mobile Logo for small screens */}
                            <div className="lg:hidden flex justify-center mb-4">
                                <div className="bg-pink-100 p-3 rounded-full">
                                    <span className="text-pink-600 font-bold text-xl">AD</span>
                                </div>
                            </div>
                            <CardTitle className="text-2xl text-center lg:text-left">Login</CardTitle>
                            <CardDescription className="text-center lg:text-left">
                                Digite seu email e senha abaixo
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleLogin}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="email"
                                            placeholder="nome@exemplo.com"
                                            type="email"
                                            className="pl-10"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Senha</Label>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="password"
                                            type="password"
                                            className="pl-10"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="remember" />
                                    <Label htmlFor="remember" className="text-sm font-normal text-gray-500">
                                        Lembrar de mim por 30 dias
                                    </Label>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    type="submit"
                                    className="w-full text-white h-11"
                                >
                                    Entrar
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
