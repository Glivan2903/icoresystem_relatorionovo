
import React from 'react';

interface ReportHeaderProps {
    title: string;
    children?: React.ReactNode;
}

export function ReportHeader({ title, children }: ReportHeaderProps) {
    return (
        <div className="hidden print:block mb-6 font-sans">
            <style type="text/css" media="print">
                {`
                    @page {
                        size: portrait;
                        margin: 5mm;
                    }
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                        table { font-size: 10px; }
                        td, th { padding: 4px !important; }
                    }
                `}
            </style>

            {/* Container Principal com borda amarela arredondada */}
            <div className="bg-[#FFF9C4] border-2 border-[#FBC02D] rounded-xl p-4 mb-4 text-center shadow-sm">



                {/* Subtítulo */}
                <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide mb-2">
                    Distribuidora IcoreTech
                </h2>

                {/* Slogan / Texto pequeno */}
                <p className="text-[10px] text-gray-600 font-medium italic mb-3">
                    8 Anos Distribuindo para região do cariri<br />
                    (Até aqui o Senhor nos ajudou)
                </p>

                {/* Informações de Contato e Endereço */}
                <div className="text-xs text-gray-700 flex justify-between items-center px-4 mt-1">
                    <div className="font-semibold text-left flex flex-col">
                        <span>Rua Da Paz 92 - Pirajá</span>
                        <span>Juazeiro do Norte (CE)</span>
                    </div>
                    <div className="flex flex-col items-end text-right font-medium">
                        <span>WhatsApp (88) 98171-2559</span>
                        <span>Instagram @icore.peças</span>
                    </div>
                </div>
            </div>

            {/* Título do Relatório Específico */}
            <div className="text-center space-y-2 mb-6">
                <h3 className="text-xl font-bold uppercase tracking-wide inline-block px-8 pb-1 border-b-2 border-slate-900">
                    {title}
                </h3>
            </div>

            {/* Filtros ou conteúdo extra do cabeçalho */}
            {children && (
                <div className="mb-4">
                    {children}
                </div>
            )}
        </div>
    );
}
