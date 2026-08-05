import React from 'react';
import { Copyright, Server, AlertTriangle, Scale } from 'lucide-react';
import LegalPage, { Section } from '../../components/layout/LegalPage';

const DMCA = () => {
  return (
    <LegalPage 
      title="DMCA" 
      subtitle="Política de Derechos de Autor y Propiedad Intelectual"
      icon={Copyright}
    >
      <div className="space-y-5">
        {/* Important notice banner */}
        <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border border-red-500/15">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-white font-black text-base mb-2">Aviso Importante</h3>
              <p className="text-red-400/90 text-sm font-bold leading-relaxed">
                ZENKAI ANIME <strong className="text-white">NO ALOJA NINGÚN TIPO DE ARCHIVO MULTIMEDIA</strong> en sus propios servidores. 
                El servicio funciona exclusivamente como un motor de búsqueda y agregador de enlaces.
              </p>
            </div>
          </div>
        </div>

        <Section title="Naturaleza del Servicio" icon={Scale}>
          <p>
            ZENKAI ANIME funciona de manera similar a un motor de búsqueda convencional (como Google). 
            La plataforma automatiza la indexación de enlaces que ya se encuentran disponibles 
            públicamente en Internet. No tenemos control sobre la creación, distribución o 
            almacenamiento de los archivos multimedia que se encuentran a través de nuestro servicio.
          </p>
        </Section>

        <Section title="Contenido de Terceros" icon={Server}>
          <p>
            Todos los videos, imágenes, marcas registradas y otros medios que se pueden encontrar 
            a través de nuestro buscador o reproductores incrustados son propiedad de sus respectivos 
            dueños y autores.
          </p>
          <p className="mt-3">
            <strong className="text-white">ZENKAI ANIME no tiene control ni responsabilidad</strong> sobre 
            el contenido que se encuentra en los servidores de terceros (como Fembed, Mega, Uqload, 
            entre otros).
          </p>
        </Section>

        <Section title="Reclamaciones de Derechos de Autor" icon={Copyright}>
          <p>
            ZENKAI ANIME respeta los derechos de propiedad intelectual de terceros. Dado que 
            <strong className="text-white"> no alojamos el contenido</strong>, no podemos eliminar 
            videos específicos de Internet.
          </p>
          <p className="mt-3">
            Si consideras que un enlace proporcionado a través de nuestra plataforma infringe 
            tus derechos de autor, te sugerimos enfáticamente{' '}
            <strong className="text-white">contactar directamente al servicio de alojamiento o 
            servidor de terceros</strong> donde se encuentra físicamente el archivo.
          </p>
          <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-primary/90 text-xs font-bold leading-relaxed">
              💡 Al eliminar el archivo del servidor de origen, nuestro sistema automatizado dejará de 
              encontrar y mostrar dicho enlace automáticamente, ya que la plataforma solo refleja 
              lo que está disponible actualmente en la red.
            </p>
          </div>
        </Section>
      </div>
    </LegalPage>
  );
};

export default DMCA;
