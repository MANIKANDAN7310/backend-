import React, { useEffect, useState } from 'react';

const LanguageSelector = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedLang, setSelectedLang] = useState('en');
    const [searchTerm, setSearchTerm] = useState('');

    const languages = [
        { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
        { code: 'sq', name: 'Albanian', flag: '🇦🇱' },
        { code: 'am', name: 'Amharic', flag: '🇪🇹' },
        { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
        { code: 'hy', name: 'Armenian', flag: '🇦🇲' },
        { code: 'az', name: 'Azerbaijani', flag: '🇦🇿' },
        { code: 'eu', name: 'Basque', flag: '🇪🇸' },
        { code: 'be', name: 'Belarusian', flag: '🇧🇾' },
        { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
        { code: 'bs', name: 'Bosnian', flag: '🇧🇦' },
        { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
        { code: 'ca', name: 'Catalan', flag: '🇪🇸' },
        { code: 'ceb', name: 'Cebuano', flag: '🇵🇭' },
        { code: 'ny', name: 'Chichewa', flag: '🇲🇼' },
        { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
        { code: 'zh-TW', name: 'Chinese (Traditional)', flag: '🇹🇼' },
        { code: 'co', name: 'Corsican', flag: '🇫🇷' },
        { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
        { code: 'cs', name: 'Czech', flag: '🇨🇿' },
        { code: 'da', name: 'Danish', flag: '🇩🇰' },
        { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'eo', name: 'Esperanto', flag: '🏳️' },
        { code: 'et', name: 'Estonian', flag: '🇪🇪' },
        { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
        { code: 'fi', name: 'Finnish', flag: '�🇮' },
        { code: 'fr', name: 'French', flag: '🇫🇷' },
        { code: 'fy', name: 'Frisian', flag: '🇳�' },
        { code: 'gl', name: 'Galician', flag: '🇪🇸' },
        { code: 'ka', name: 'Georgian', flag: '🇬🇪' },
        { code: 'de', name: 'German', flag: '🇩🇪' },
        { code: 'el', name: 'Greek', flag: '🇬🇷' },
        { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
        { code: 'ht', name: 'Haitian Creole', flag: '🇭🇹' },
        { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
        { code: 'haw', name: 'Hawaiian', flag: '🇺🇸' },
        { code: 'iw', name: 'Hebrew', flag: '🇮🇱' },
        { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
        { code: 'hmn', name: 'Hmong', flag: '🇨🇳' },
        { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
        { code: 'is', name: 'Icelandic', flag: '�🇸' },
        { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
        { code: 'id', name: 'Indonesian', flag: '🇮�🇩' },
        { code: 'ga', name: 'Irish', flag: '��🇪' },
        { code: 'it', name: 'Italiano', flag: '🇮🇹' },
        { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
        { code: 'jw', name: 'Javanese', flag: '🇮🇩' },
        { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
        { code: 'kk', name: 'Kazakh', flag: '🇰🇿' },
        { code: 'km', name: 'Khmer', flag: '🇰🇭' },
        { code: 'ko', name: 'Korean', flag: '🇰🇷' },
        { code: 'ku', name: 'Kurdish (Kurmanji)', flag: '🇹🇷' },
        { code: 'ky', name: 'Kyrgyz', flag: '🇰🇬' },
        { code: 'lo', name: 'Lao', flag: '🇱🇦' },
        { code: 'la', name: 'Latin', flag: '🇻🇦' },
        { code: 'lv', name: 'Latvian', flag: '🇱🇻' },
        { code: 'lt', name: 'Lithuanian', flag: '🇱🇹' },
        { code: 'lb', name: 'Luxembourgish', flag: '��' },
        { code: 'mk', name: 'Macedonian', flag: '🇲🇰' },
        { code: 'mg', name: 'Malagasy', flag: '🇲🇬' },
        { code: 'ms', name: 'Malay', flag: '🇲🇾' },
        { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
        { code: 'mt', name: 'Maltese', flag: '🇲�🇹' },
        { code: 'mi', name: 'Maori', flag: '🇳🇿' },
        { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
        { code: 'mn', name: 'Mongolian', flag: '🇲🇳' },
        { code: 'my', name: 'Myanmar (Burmese)', flag: '🇲🇲' },
        { code: 'ne', name: 'Nepali', flag: '🇳🇵' },
        { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
        { code: 'ps', name: 'Pashto', flag: '🇦🇫' },
        { code: 'fa', name: 'Persian', flag: '🇮🇷' },
        { code: 'pl', name: 'Polish', flag: '🇵🇱' },
        { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
        { code: 'pa', name: 'Punjabi', flag: '�🇳' },
        { code: 'ro', name: 'Romanian', flag: '🇷e' },
        { code: 'ru', name: 'Russian', flag: '🇷🇺' },
        { code: 'sm', name: 'Samoan', flag: '🇼🇸' },
        { code: 'gd', name: 'Scots Gaelic', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
        { code: 'sr', name: 'Serbian', flag: '🇷🇸' },
        { code: 'st', name: 'Sesotho', flag: '🇱🇸' },
        { code: 'sn', name: 'Shona', flag: '🇿�' },
        { code: 'sd', name: 'Sindhi', flag: '🇵🇰' },
        { code: 'si', name: 'Sinhala', flag: '🇱🇰' },
        { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
        { code: 'sl', name: 'Slovenian', flag: '🇸🇮' },
        { code: 'so', name: 'Somali', flag: '🇸🇴' },
        { code: 'es', name: 'Spanish', flag: '🇪🇸' },
        { code: 'su', name: 'Sundanese', flag: '🇮🇩' },
        { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
        { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
        { code: 'tg', name: 'Tajik', flag: '🇹�' },
        { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
        { code: 'te', name: 'Telugu', flag: '🇮🇳' },
        { code: 'th', name: 'Thai', flag: '🇹🇭' },
        { code: 'tr', name: 'Turkish', flag: '🇹�🇷' },
        { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
        { code: 'ur', name: 'Urdu', flag: '🇵�' },
        { code: 'uz', name: 'Uzbek', flag: '🇺🇿' },
        { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
        { code: 'cy', name: 'Welsh', flag: '�󠁧󠁢󠁷󠁬󠁳󠁿' },
        { code: 'xh', name: 'Xhosa', flag: '��🇦' },
        { code: 'yi', name: 'Yiddish', flag: '🇮�' },
        { code: 'yo', name: 'Yoruba', flag: '�🇳🇬' },
        { code: 'zu', name: 'Zulu', flag: '🇿🇦' }
    ];

    useEffect(() => {
        // Check for existing language cookie
        const getCookie = (name) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
        };

        const currentLang = getCookie('googtrans');
        if (currentLang) {
            // Cookie format is usually /auto/en or /en/es
            const langCode = currentLang.split('/').pop();
            setSelectedLang(langCode);
        }

        // Check if script is already added
        if (document.querySelector('script[src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"]')) {
            return;
        }

        // Initialize Google Translate
        const addScript = document.createElement('script');
        addScript.setAttribute('src', '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit');
        document.body.appendChild(addScript);

        window.googleTranslateElementInit = () => {
            new window.google.translate.TranslateElement({
                pageLanguage: 'en',
                layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false,
            }, 'google_translate_element');
        };
    }, []);

    const changeLanguage = (langCode) => {
        setSelectedLang(langCode);

        // set cookie for persistence
        document.cookie = `googtrans=/auto/${langCode}; path=/; domain=${window.location.hostname}`;
        document.cookie = `googtrans=/auto/${langCode}; path=/;`; // fallback

        const googleTranslateCombine = document.querySelector('.goog-te-combo');
        if (googleTranslateCombine) {
            googleTranslateCombine.value = langCode;
            googleTranslateCombine.dispatchEvent(new Event('change'));
        } else {
            // specific fallback: if combo not found (hidden mode issues), reload might be needed to apply cookie
            window.location.reload();
        }
        setShowDropdown(false);
    };

    const filteredLanguages = languages.filter(lang =>
        lang.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="language-selector-container">
            <button
                className="lang-icon-btn"
                onClick={() => setShowDropdown(!showDropdown)}
                title="Select Language"
            >
                🌐
            </button>

            {/* Custom Dropdown */}
            <div className={`lang-custom-dropdown ${showDropdown ? 'show' : ''}`}>
                <input
                    type="text"
                    placeholder="Search language..."
                    className="lang-search"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    value={searchTerm}
                />
                <div className="lang-grid">
                    {filteredLanguages.map((lang) => (
                        <button
                            key={lang.code}
                            className={`lang-option ${selectedLang === lang.code ? 'active' : ''}`}
                            onClick={() => changeLanguage(lang.code)}
                        >
                            <span className="lang-flag">{lang.flag}</span>
                            <span className="lang-name">{lang.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Hidden Google Translate Widget */}
            <div id="google_translate_element" style={{ display: 'none' }}></div>
        </div>
    );
};

export default LanguageSelector;
