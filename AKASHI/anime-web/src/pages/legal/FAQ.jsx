import React from 'react';
import { HelpCircle, Smartphone, ShieldAlert, History, CreditCard } from 'lucide-react';
import LegalPage, { AccordionItem } from '../../components/layout/LegalPage';

const FAQ = () => {
  return (
    <LegalPage 
      title="Preguntas Frecuentes" 
      subtitle="Encuentra respuestas rápidas a las dudas más comunes"
      icon={HelpCircle}
    >
      <div className="space-y-3">
        <AccordionItem question="¿ZENKAI ANIME es completamente gratis?">
          <div className="flex items-start gap-3">
            <CreditCard size={18} className="text-primary shrink-0 mt-0.5" />
            <p>
              Sí, ZENKAI ANIME es una plataforma <strong className="text-white">completamente gratuita</strong>. 
              No hay suscripciones, cuentas de pago ni costos ocultos. Disfruta de todo el catálogo 
              sin límites ni restricciones.
            </p>
          </div>
        </AccordionItem>

        <AccordionItem question="¿Por qué veo publicidad en los videos?">
          <p>
            Los reproductores de video provienen de <strong className="text-white">servidores de terceros</strong> 
            {' '}(como Fembed, Mega, etc.). ZENKAI ANIME no aloja videos ni inserta publicidad, pero los 
            servidores externos que alojan el contenido sí pueden hacerlo para mantener sus servidores.
          </p>
          <p className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/10 text-primary text-xs font-bold">
            💡 Recomendamos el uso de un bloqueador de anuncios (AdBlock) para una mejor experiencia.
          </p>
        </AccordionItem>

        <AccordionItem question="¿Tienen una aplicación móvil?">
          <div className="flex items-start gap-3">
            <Smartphone size={18} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p>
                Sí. Ofrecemos dos opciones para dispositivos móviles:
              </p>
              <ul className="mt-3 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span><strong className="text-white">Progressive Web App (PWA):</strong> Instálala directamente desde tu navegador en Android o iOS.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span><strong className="text-white">APK nativa para Android:</strong> Disponible en nuestra sección de descargas.</span>
                </li>
              </ul>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem question="El reproductor no funciona, ¿qué hago?">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p>
                Si el reproductor principal falla o no carga el video, intenta las siguientes soluciones:
              </p>
              <ol className="mt-3 space-y-2 list-decimal list-inside">
                <li>Cambia a otro de los <strong className="text-white">servidores disponibles</strong> en la sección de "Servidores".</li>
                <li>Desactiva temporalmente tu bloqueador de anuncios para el reproductor.</li>
                <li>Prueba en otro navegador (Chrome, Firefox, Brave).</li>
                <li>Recarga la página e inténtalo de nuevo.</li>
              </ol>
              <p className="mt-3 text-xs text-text-secondary/70">
                A veces los servidores externos pueden caerse o saturarse temporalmente.
              </p>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem question="¿Dónde se guarda mi historial de animes vistos?">
          <div className="flex items-start gap-3">
            <History size={18} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p>
                Tanto tu historial como tu lista de favoritos se guardan <strong className="text-white">localmente en tu dispositivo</strong> 
                {' '}(en la memoria del navegador).
              </p>
              <p className="mt-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10 text-yellow-500/80 text-xs font-bold">
                ⚠️ Si borras los datos de navegación o usas el modo incógnito, perderás esta información. 
                Inicia sesión con Google para sincronizar tus datos en la nube.
              </p>
            </div>
          </div>
        </AccordionItem>
      </div>
    </LegalPage>
  );
};

export default FAQ;
