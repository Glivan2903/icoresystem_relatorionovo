
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
            <div className="bg-[#FFF9C4] border-2 border-[#FBC02D] rounded-xl p-2 mb-4 shadow-sm">
                <div className="flex justify-between items-center px-2">
                    {/* Lado Esquerdo: Endereço */}
                    <div className="flex flex-col text-xs text-gray-700 font-semibold text-left w-1/3">
                        <span>Rua Da Paz 92 - Pirajá</span>
                        <span>Juazeiro do Norte (CE)</span>
                    </div>

                    {/* Centro: Título e Slogan */}
                    <div className="text-center w-1/3">
                        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide leading-tight">
                            Distribuidora IcoreTech
                        </h2>
                        <p className="text-[10px] text-gray-600 font-medium italic mt-1">
                            8 Anos Distribuindo para região do cariri<br />
                            (Até aqui o Senhor nos ajudou)
                        </p>
                    </div>

                    {/* Lado Direito: Contatos */}
                    <div className="flex flex-col text-xs text-gray-700 font-medium text-right w-1/3">
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
