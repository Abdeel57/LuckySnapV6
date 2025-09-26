import React, { useState, useEffect } from 'react';
import { getSettings } from '../services/api';
import { PaymentAccount } from '../types';
import PageAnimator from '../components/PageAnimator';
import Spinner from '../components/Spinner';

const PaymentAccountsPage = () => {
    const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSettings().then(settings => {
            setAccounts(settings.paymentAccounts);
            setLoading(false);
        });
    }, []);

    return (
        <PageAnimator>
            <div className="container mx-auto px-4 max-w-3xl py-12">
                <h1 className="text-3xl font-bold text-center text-white mb-4">Cuentas para Realizar tu Pago</h1>
                <p className="text-slate-300 text-center mb-10">
                    Una vez realizado tu pago, por favor envía tu comprobante a nuestro WhatsApp para confirmar tu apartado.
                </p>

                {loading ? <Spinner /> : (
                    <div className="space-y-6">
                        {accounts.map(acc => (
                            <div key={acc.id} className="bg-background-secondary p-6 rounded-lg border border-slate-700/50 shadow-lg">
                                <h2 className="text-xl font-bold text-white mb-3">{acc.bank}</h2>
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-semibold text-slate-300">Titular:</span> {acc.accountHolder}</p>
                                    <p><span className="font-semibold text-slate-300">No. de Cuenta:</span> {acc.accountNumber}</p>
                                    <p><span className="font-semibold text-slate-300">CLABE:</span> {acc.clabe}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageAnimator>
    );
};

export default PaymentAccountsPage;
