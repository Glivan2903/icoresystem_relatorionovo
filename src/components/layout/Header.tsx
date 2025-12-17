import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

export function Header() {
    return (
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
            <h2 className="text-lg font-medium">Gestão Click Integration</h2>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                    <Avatar>
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                        <p className="font-medium">Admin User</p>
                        <p className="text-muted-foreground text-xs">admin@gestao.com</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
