import React from 'react';
import PageAnimator from '../components/PageAnimator';
import Button from '../components/ui/Button';

const SECTIONS: { title: string; paragraphs?: string[]; items?: string[] }[] = [
  {
    title: '1. Aceptación de términos',
    paragraphs: ['Al utilizar los servicios de Lucky Snap, usted acepta estar sujeto a estos términos y condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.'],
  },
  {
    title: '2. Descripción del servicio',
    paragraphs: ['Lucky Snap es una plataforma de rifas en línea que permite a los usuarios participar en sorteos de diversos premios. Los usuarios pueden comprar boletos para participar en las rifas disponibles.'],
  },
  {
    title: '3. Participación en rifas',
    items: [
      'Los participantes deben ser mayores de 18 años.',
      'Cada boleto tiene un número único y no puede ser transferido.',
      'Los boletos deben ser pagados antes de la fecha límite establecida.',
      'Lucky Snap se reserva el derecho de cancelar cualquier rifa sin previo aviso.',
    ],
  },
  {
    title: '4. Pagos y reembolsos',
    items: [
      'Los pagos deben realizarse dentro de las 24 horas posteriores a la compra del boleto.',
      'Los reembolsos solo se procesarán en casos excepcionales y a discreción de Lucky Snap.',
      'Los boletos no pagados serán cancelados automáticamente.',
    ],
  },
  {
    title: '5. Selección de ganadores',
    items: [
      'Los ganadores se seleccionan mediante un sistema aleatorio transparente.',
      'Los resultados se publican en nuestra plataforma y redes sociales.',
      'Los ganadores serán contactados dentro de las 48 horas posteriores al sorteo.',
      'Los premios deben ser reclamados dentro de 30 días después del sorteo.',
    ],
  },
  {
    title: '6. Responsabilidades del usuario',
    items: [
      'Proporcionar información veraz y actualizada.',
      'Mantener la confidencialidad de su cuenta.',
      'No utilizar la plataforma para actividades ilegales.',
      'Respetar a otros usuarios y el personal de Lucky Snap.',
    ],
  },
  {
    title: '7. Limitación de responsabilidad',
    paragraphs: ['Lucky Snap no será responsable por daños indirectos, incidentales o consecuenciales que puedan surgir del uso de nuestros servicios. Nuestra responsabilidad se limita al valor del boleto comprado.'],
  },
  {
    title: '8. Modificaciones',
    paragraphs: ['Lucky Snap se reserva el derecho de modificar estos términos y condiciones en cualquier momento. Los cambios serán notificados a través de nuestra plataforma.'],
  },
  {
    title: '9. Contacto',
    paragraphs: ['Para cualquier consulta sobre estos términos y condiciones, puede contactarnos a través de nuestros canales oficiales de comunicación.'],
  },
];

const TermsPage = () => (
  <PageAnimator>
    <div className="container mx-auto px-4 sm:px-6 max-w-3xl pt-8 md:pt-14">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent mb-2">Legal</p>
      <h1 className="text-display font-extrabold text-white">Términos y condiciones</h1>

      <div className="mt-8 space-y-8">
        {SECTIONS.map(section => (
          <section key={section.title}>
            <h2 className="text-lg font-extrabold text-white mb-2">{section.title}</h2>
            {section.paragraphs?.map(p => <p key={p} className="text-[15px] text-slate-300">{p}</p>)}
            {section.items && (
              <ul className="list-disc pl-5 space-y-1.5 text-[15px] text-slate-300 marker:text-slate-400">
                {section.items.map(item => <li key={item}>{item}</li>)}
              </ul>
            )}
          </section>
        ))}
      </div>

      <div className="mt-10">
        <Button to="/" variant="secondary">Volver al inicio</Button>
      </div>
    </div>
  </PageAnimator>
);

export default TermsPage;
