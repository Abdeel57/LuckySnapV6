import React, { useState, useEffect } from 'react';
import { Check, Copy, Landmark, MessageCircle } from 'lucide-react';
import { getSettings } from '../services/api';
import { PaymentAccount } from '../types';
import PageAnimator from '../components/PageAnimator';
import Spinner from '../components/Spinner';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../hooks/useToast';

const PaymentAccountsPage = () => {
    const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
    const [whatsapp, setWhatsapp] = useState('');
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const toast = useToast();

    useEffect(() => {
        getSettings()
            .then(settings => {
                setAccounts(settings.paymentAccounts || []);
                setWhatsapp(settings.contactInfo?.whatsapp || '');
            })
            .catch(() => setAccounts([]))
            .finally(() => setLoading(false));
    }, []);

    const copyToClipboard = async (text: string, accountId: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(accountId);
            toast.success('Número de cuenta copiado');
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            toast.error('No se pudo copiar', 'Selecciona el número y cópialo manualmente.');
        }
    };

    return (
        <PageAnimator>
            <div className="container mx-auto px-4 sm:px-6 max-w-3xl pt-8 md:pt-14">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent mb-2">Pagos</p>
                <h1 className="text-display font-extrabold text-white">Cuentas de pago</h1>
                <p className="mt-3 text-slate-400 max-w-xl">
                    Transfiere el total de tu apartado a una de estas cuentas usando tu folio como referencia y envíanos el comprobante por WhatsApp.
                </p>

                {loading ? (
                    <div className="py-16"><Spinner size="lg" /></div>
                ) : accounts.length === 0 ? (
                    <Card className="mt-8 text-center">
                        <p className="text-slate-300">Por ahora no hay cuentas publicadas.</p>
                        {whatsapp && <p className="mt-1 text-sm text-slate-400">Escríbenos por WhatsApp para coordinar tu pago.</p>}
                    </Card>
                ) : (
                    <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                        {accounts.map(acc => (
                            <li key={acc.id}>
                                <Card className="h-full">
                                    <div className="flex items-center gap-2.5">
                                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.06] text-slate-300"><Landmark className="w-4 h-4" aria-hidden /></span>
                                        <h2 className="font-extrabold text-white">{acc.bank}</h2>
                                    </div>
                                    <dl className="mt-4 space-y-3">
                                        <div>
                                            <dt className="text-xs font-semibold text-slate-400">Titular</dt>
                                            <dd className="text-[15px] font-semibold text-white break-words">{acc.accountHolder}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-semibold text-slate-400">Número de cuenta</dt>
                                            <dd className="mt-1 flex items-center justify-between gap-3">
                                                <span className="tnum text-lg font-extrabold text-white break-all select-all">{acc.accountNumber}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(acc.accountNumber, acc.id)}
                                                    className="flex-shrink-0 inline-flex items-center gap-1.5 h-10 px-3 rounded-lg bg-white/[0.06] border border-white/10 text-xs font-semibold text-white hover:bg-white/10"
                                                    aria-label={`Copiar número de cuenta de ${acc.bank}`}
                                                >
                                                    {copiedId === acc.id ? <Check className="w-3.5 h-3.5" aria-hidden /> : <Copy className="w-3.5 h-3.5" aria-hidden />}
                                                    {copiedId === acc.id ? 'Copiado' : 'Copiar'}
                                                </button>
                                            </dd>
                                        </div>
                                    </dl>
                                </Card>
                            </li>
                        ))}
                    </ul>
                )}

                {whatsapp && (
                    <Card tone="subtle" className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <p className="font-extrabold text-white">¿Ya pagaste?</p>
                            <p className="text-sm text-slate-400">Envíanos el comprobante con tu folio para confirmar tus boletos.</p>
                        </div>
                        <Button href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" variant="whatsapp" icon={<MessageCircle className="w-5 h-5" aria-hidden />} className="flex-shrink-0">
                            Enviar comprobante
                        </Button>
                    </Card>
                )}
            </div>
        </PageAnimator>
    );
};

export default PaymentAccountsPage;
