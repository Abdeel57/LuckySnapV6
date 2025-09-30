import React from 'react';
import PageAnimator from '../components/PageAnimator';
import { Link } from 'react-router-dom';

const TermsPage = () => {
  return (
    <PageAnimator>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Términos y Condiciones</h1>
          <p className="text-slate-300">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
        </div>

        <div className="bg-background-secondary p-8 rounded-lg border border-slate-700/50 shadow-lg space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Aceptación de Términos</h2>
            <p className="text-slate-300 leading-relaxed">
              Al utilizar los servicios de Lucky Snap, usted acepta estar sujeto a estos términos y condiciones. 
              Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Descripción del Servicio</h2>
            <p className="text-slate-300 leading-relaxed">
              Lucky Snap es una plataforma de rifas en línea que permite a los usuarios participar en sorteos 
              de diversos premios. Los usuarios pueden comprar boletos para participar en las rifas disponibles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Participación en Rifas</h2>
            <div className="text-slate-300 leading-relaxed space-y-3">
              <p>• Los participantes deben ser mayores de 18 años.</p>
              <p>• Cada boleto tiene un número único y no puede ser transferido.</p>
              <p>• Los boletos deben ser pagados antes de la fecha límite establecida.</p>
              <p>• Lucky Snap se reserva el derecho de cancelar cualquier rifa sin previo aviso.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Pagos y Reembolsos</h2>
            <div className="text-slate-300 leading-relaxed space-y-3">
              <p>• Los pagos deben realizarse dentro de las 24 horas posteriores a la compra del boleto.</p>
              <p>• Los reembolsos solo se procesarán en casos excepcionales y a discreción de Lucky Snap.</p>
              <p>• Los boletos no pagados serán cancelados automáticamente.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Selección de Ganadores</h2>
            <div className="text-slate-300 leading-relaxed space-y-3">
              <p>• Los ganadores se seleccionan mediante un sistema aleatorio transparente.</p>
              <p>• Los resultados se publican en nuestra plataforma y redes sociales.</p>
              <p>• Los ganadores serán contactados dentro de las 48 horas posteriores al sorteo.</p>
              <p>• Los premios deben ser reclamados dentro de 30 días después del sorteo.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Responsabilidades del Usuario</h2>
            <div className="text-slate-300 leading-relaxed space-y-3">
              <p>• Proporcionar información veraz y actualizada.</p>
              <p>• Mantener la confidencialidad de su cuenta.</p>
              <p>• No utilizar la plataforma para actividades ilegales.</p>
              <p>• Respetar a otros usuarios y el personal de Lucky Snap.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Limitación de Responsabilidad</h2>
            <p className="text-slate-300 leading-relaxed">
              Lucky Snap no será responsable por daños indirectos, incidentales o consecuenciales que puedan 
              surgir del uso de nuestros servicios. Nuestra responsabilidad se limita al valor del boleto comprado.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Modificaciones</h2>
            <p className="text-slate-300 leading-relaxed">
              Lucky Snap se reserva el derecho de modificar estos términos y condiciones en cualquier momento. 
              Los cambios serán notificados a través de nuestra plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Contacto</h2>
            <p className="text-slate-300 leading-relaxed">
              Para cualquier consulta sobre estos términos y condiciones, puede contactarnos a través de 
              nuestros canales oficiales de comunicación.
            </p>
          </section>
        </div>

        <div className="text-center mt-8">
          <Link
            to="/"
            className="bg-action text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    </PageAnimator>
  );
};

export default TermsPage;
