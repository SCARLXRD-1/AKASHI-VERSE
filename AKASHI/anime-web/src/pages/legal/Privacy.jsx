import React from 'react';
import { Lock, Database, ExternalLink, Cookie } from 'lucide-react';
import LegalPage, { Section } from '../../components/layout/LegalPage';

const Privacy = () => {
  return (
    <LegalPage 
      title="Política de Privacidad" 
      subtitle={`Última actualización: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`}
      icon={Lock}
    >
      <div className="space-y-5">
        <Section title="Información que Recopilamos" icon={Database}>
          <p>
            <strong className="text-white">No recopilamos información personal identificable</strong> de los usuarios 
            que simplemente navegan por la plataforma. 
          </p>
          <p className="mt-3">
            Solo almacenamos preferencias locales en tu dispositivo utilizando el 
            almacenamiento local (LocalStorage) de tu navegador:
          </p>
          <ul className="mt-3 space-y-2">
            {[
              'Lista de favoritos y animes guardados',
              'Historial de episodios vistos',
              'Preferencias de tema e interfaz',
              'Configuración de idioma de reproducción'
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Uso de la Información" icon={Lock}>
          <p>
            La información de preferencias guardada localmente se utiliza exclusivamente para 
            mejorar tu experiencia en <strong className="text-white">ZENKAI ANIME</strong>, como recordar 
            los episodios que ya has visto o la configuración de tu interfaz.
          </p>
          <p className="mt-3">
            Si optas por iniciar sesión con Google, tus datos de perfil (nombre y foto) se utilizan 
            únicamente para personalizar tu experiencia y sincronizar tu progreso entre dispositivos.
          </p>
        </Section>

        <Section title="Servicios de Terceros" icon={Cookie}>
          <p>
            Nuestra plataforma indexa y muestra reproductores de video alojados en servicios de terceros. 
            Estos proveedores externos pueden utilizar cookies, balizas web y tecnologías similares 
            para recopilar datos sobre tu comportamiento, incluidos los anuncios que se muestran.
          </p>
          <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-primary/90 text-xs font-bold">
              🔒 No tenemos acceso ni control sobre las cookies de terceros. 
              Recomendamos revisar las políticas de privacidad de cada servicio externo.
            </p>
          </div>
        </Section>

        <Section title="Enlaces a Otros Sitios" icon={ExternalLink}>
          <p>
            Nuestro servicio contiene enlaces a otros sitios que no son operados por nosotros. 
            Si haces clic en un enlace de un tercero o en un reproductor de video incrustado, 
            serás dirigido al sitio de ese tercero. 
          </p>
          <p className="mt-3">
            Te recomendamos encarecidamente que revises la Política de Privacidad de cada sitio que visites.
          </p>
        </Section>
      </div>
    </LegalPage>
  );
};

export default Privacy;
