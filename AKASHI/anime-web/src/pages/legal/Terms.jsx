import React from 'react';
import { FileText, Globe, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import LegalPage, { Section } from '../../components/layout/LegalPage';

const Terms = () => {
  return (
    <LegalPage 
      title="Términos de Uso" 
      subtitle={`Última actualización: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`}
      icon={FileText}
    >
      <div className="space-y-5">
        <Section title="Aceptación de los Términos" icon={FileText}>
          <p>
            Al acceder y utilizar <strong className="text-white">ZENKAI ANIME</strong>, aceptas estar sujeto a estos Términos de Uso. 
            Si no estás de acuerdo con alguna parte de estos términos, no debes usar nuestra plataforma.
          </p>
        </Section>

        <Section title="Naturaleza del Servicio y Contenido de Terceros" icon={Globe}>
          <p>
            <strong className="text-white">ZENKAI ANIME actúa como un motor de búsqueda y agregador de enlaces (API).</strong>{' '}
            Nosotros no alojamos, subimos ni controlamos ningún archivo multimedia (como videos, imágenes 
            o episodios de anime) en nuestros propios servidores. Todo el contenido multimedia al que 
            se accede a través de la plataforma proviene directamente de servicios de terceros y servidores externos.
          </p>
          <div className="mt-4 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-yellow-500/90 text-xs font-bold leading-relaxed">
                Dado que consumimos una API de terceros para recopilar y organizar estos enlaces, 
                el sitio web puede contener enlaces o dirigir a páginas de terceros. ZENKAI ANIME 
                no tiene control sobre el contenido, las políticas de privacidad, la publicidad o las 
                prácticas de los sitios web o servicios de terceros, y por ende, no asume ninguna 
                responsabilidad ni puede garantizar la evitación total de elementos externos (como ventanas 
                emergentes o publicidad) que puedan estar incrustados en los reproductores de terceros.
              </p>
            </div>
          </div>
        </Section>

        <Section title="Uso de la Plataforma" icon={Shield}>
          <p>
            El usuario se compromete a usar la plataforma únicamente con fines de entretenimiento 
            personal y no comercial. Está prohibido:
          </p>
          <ul className="mt-3 space-y-2">
            {[
              'Redistribuir o vender el acceso a la plataforma.',
              'Utilizar herramientas automatizadas (bots, scrapers) para extraer contenido.',
              'Intentar vulnerar la seguridad o los sistemas de la plataforma.',
              'Cualquier uso ilegal o no autorizado de los servicios.'
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Limitación de Responsabilidad" icon={AlertTriangle}>
          <p>
            En la máxima medida permitida por la ley aplicable, ZENKAI ANIME no será responsable de 
            ningún daño indirecto, incidental, especial, consecuente o punitivo, o cualquier pérdida 
            de beneficios o ingresos, ya sea incurrida directa o indirectamente, o cualquier pérdida 
            de datos, uso, buena voluntad, u otras pérdidas intangibles, resultantes de:
          </p>
          <ul className="mt-3 space-y-2">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
              <span>Tu acceso o uso de o incapacidad para acceder o utilizar el servicio.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
              <span>Cualquier conducta o contenido de terceros en el servicio.</span>
            </li>
          </ul>
        </Section>

        <Section title="Cambios a estos Términos" icon={RefreshCw}>
          <p>
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios 
            entrarán en vigor inmediatamente después de su publicación en el sitio. Es tu responsabilidad 
            revisar estos términos periódicamente.
          </p>
        </Section>
      </div>
    </LegalPage>
  );
};

export default Terms;
