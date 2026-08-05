import React from 'react';
import { MessageSquare, Users, Briefcase } from 'lucide-react';
import LegalPage, { Section } from '../../components/layout/LegalPage';

const Contact = () => {
  return (
    <LegalPage 
      title="Contacto" 
      subtitle="¿Tienes alguna duda o sugerencia? Estamos aquí para ayudarte"
      icon={MessageSquare}
    >
      <div className="space-y-5">
        <Section title="Redes Sociales y Comunidad" icon={Users}>
          <p>
            La mejor manera de interactuar con el equipo de <strong className="text-white">ZENKAI ANIME</strong> y 
            con otros miembros de la comunidad es a través de nuestras redes sociales oficiales.
          </p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: 'Discord', desc: 'Únete a la comunidad', color: 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/15', textColor: 'text-indigo-400' },
              { name: 'Twitter / X', desc: 'Últimas novedades', color: 'from-sky-500/10 to-sky-600/5 border-sky-500/15', textColor: 'text-sky-400' },
              { name: 'GitHub', desc: 'Proyecto open source', color: 'from-gray-500/10 to-gray-600/5 border-gray-500/15', textColor: 'text-gray-400' },
              { name: 'Instagram', desc: 'Contenido visual', color: 'from-pink-500/10 to-pink-600/5 border-pink-500/15', textColor: 'text-pink-400' },
            ].map((social) => (
              <div key={social.name} className={`p-4 rounded-xl bg-gradient-to-br ${social.color} border`}>
                <p className={`font-black text-sm ${social.textColor}`}>{social.name}</p>
                <p className="text-text-secondary text-xs mt-0.5">{social.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Consultas Profesionales" icon={Briefcase}>
          <p>
            Para asuntos relacionados con alianzas, cooperación o temas legales, por favor 
            envía un correo a nuestro equipo administrativo.
          </p>
          <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-primary/90 text-xs font-bold">
              📝 Nota: ZENKAI ANIME no aloja contenido protegido por derechos de autor. 
              Por favor, lee nuestra sección DMCA antes de contactarnos sobre este tema.
            </p>
          </div>
        </Section>

        <Section title="Reportar un Problema" icon={MessageSquare}>
          <p>
            Si encuentras un error en la plataforma, un reproductor que no funciona, 
            o cualquier otro problema técnico, puedes reportarlo a través de nuestras redes sociales 
            o creando un issue en nuestro repositorio de GitHub.
          </p>
          <p className="mt-3">
            Al reportar, incluye:
          </p>
          <ul className="mt-2 space-y-2">
            {[
              'Nombre del anime y número de episodio afectado',
              'Navegador y dispositivo que estás usando',
              'Captura de pantalla del error (si aplica)',
              'Descripción breve del problema'
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary text-[10px] font-black">
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </LegalPage>
  );
};

export default Contact;
