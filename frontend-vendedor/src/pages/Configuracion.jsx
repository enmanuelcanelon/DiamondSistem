import GoogleCalendarConnect from '../components/GoogleCalendarConnect';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Settings } from 'lucide-react';

function Configuracion() {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6" />
        <h1 className="text-3xl font-bold">{t('configuracion.title')}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <GoogleCalendarConnect />
      </div>
    </div>
  );
}

export default Configuracion;

