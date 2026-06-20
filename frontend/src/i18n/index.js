import en from './en.js';
import es from './es.js';
import fr from './fr.js';
import de from './de.js';
import it from './it.js';
import pt from './pt.js';
import ru from './ru.js';
import ja from './ja.js';
import ko from './ko.js';
import zh from './zh.js';

const languages = { en, es, fr, de, it, pt, ru, ja, ko, zh };

let currentLang = 'en';

export function setLanguage(lang) {
    if (languages[lang]) {
        currentLang = lang;
    }
}

export function getCurrentLanguage() {
    return currentLang;
}

export function t(path) {
    const obj = languages[currentLang] || languages.en;
    if (!obj) return path;
    return path.split('.').reduce((acc, key) => {
        if (acc && typeof acc === 'object' && key in acc) return acc[key];
        return path;
    }, obj);
}

export default { t, setLanguage, getCurrentLanguage };
