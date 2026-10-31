import React, { useState, useEffect } from 'react';
import { Check, Copy } from 'lucide-react';
import { WhatsAppIcon } from '../components/icons/BrandIcons';
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
                <p className="text-sm font-extrabold text-action-ink mb-1.5">Pagos</p>
                <h1 className="font-display text-display font-semibold text-ink">Cuentas de pago</h1>
                <p className="mt-3 text-muted max-w-xl">
                    Transfiere el total de tu apartado a una de estas cuentas usando tu folio como referencia y envíanos el comprobante por WhatsApp.
                </p>

                {loading ? (
                    <div className="py-16"><Spinner size="lg" /></div>
                ) : accounts.length === 0 ? (
                    <Card className="mt-8 text-center">
                        <p className="text-ink/80">Por ahora no hay cuentas publicadas.</p>
                        {whatsapp && <p className="mt-1 text-sm text-muted">Escríbenos por WhatsApp para coordinar tu pago.</p>}
                    </Card>
                ) : (
                    <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                        {accounts.map(acc => (
                            <li key={acc.id}>
                                <Card className="h-full">
                                    <h2 className="font-bold text-ink">{acc.bank}</h2>
                                    <dl className="mt-4 space-y-3">
                                        <div>
                                            <dt className="text-xs font-semibold text-muted">Titular</dt>
                                            <dd className="text-[15px] font-semibold text-ink break-words">{acc.accountHolder}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-semibold text-muted">Número de cuenta</dt>
                                            <dd className="mt-1 flex items-center justify-between gap-3">
                                                <span className="tnum text-lg font-bold text-ink break-all select-all">{acc.accountNumber}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(acc.accountNumber, acc.id)}
                                                    className="flex-shrink-0 inline-flex items-center gap-1.5 h-10 px-3 rounded-lg bg-surface border border-line text-xs font-semibold text-ink hover:bg-ink/5"
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
                            <p className="font-bold text-ink">¿Ya pagaste?</p>
                            <p className="text-sm text-muted">Envíanos el comprobante con tu folio para confirmar tus boletos.</p>
                        </div>
                        <Button href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" variant="whatsapp" icon={<WhatsAppIcon className="w-5 h-5" tone="current" />} className="flex-shrink-0">
                            Enviar comprobante
                        </Button>
                    </Card>
                )}
            </div>
        </PageAnimator>
    );
};

export default PaymentAccountsPage;
