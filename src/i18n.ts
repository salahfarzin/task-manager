import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from '../public/locales/en/common.json';
import faCommon from '../public/locales/fa/common.json';
import deCommon from '../public/locales/de/common.json';
import frCommon from '../public/locales/fr/common.json';
import ckbCommon from '../public/locales/ckb/common.json';
import kmrCommon from '../public/locales/kmr/common.json';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en:  { common: enCommon },
            fa:  { common: faCommon },
            de:  { common: deCommon },
            fr:  { common: frCommon },
            ckb: { common: ckbCommon },
            kmr: { common: kmrCommon },
        },
        lng: 'en',
        fallbackLng: 'en',
        defaultNS: 'common',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
