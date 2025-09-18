// Multi-Language Support with Auto-Detection and Optimization

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  confidence: number;
  direction: 'ltr' | 'rtl';
}

export interface LocalizedContent {
  summary: string;
  topics: string[];
  entities: {
    dates: string[];
    emails: string[];
    phones: string[];
    amounts: string[];
    names: string[];
  };
  documentType: string;
}

export class LanguageDetector {
  // Supported languages with their characteristics
  private static readonly SUPPORTED_LANGUAGES = {
    'en': { name: 'English', nativeName: 'English', direction: 'ltr' as const, patterns: ['the', 'and', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'will', 'would', 'could', 'should'] },
    'es': { name: 'Spanish', nativeName: 'Español', direction: 'ltr' as const, patterns: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para'] },
    'fr': { name: 'French', nativeName: 'Français', direction: 'ltr' as const, patterns: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se'] },
    'de': { name: 'German', nativeName: 'Deutsch', direction: 'ltr' as const, patterns: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als'] },
    'it': { name: 'Italian', nativeName: 'Italiano', direction: 'ltr' as const, patterns: ['di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'una', 'del', 'della', 'dei'] },
    'pt': { name: 'Portuguese', nativeName: 'Português', direction: 'ltr' as const, patterns: ['de', 'a', 'o', 'e', 'do', 'da', 'em', 'um', 'para', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos'] },
    'ru': { name: 'Russian', nativeName: 'Русский', direction: 'ltr' as const, patterns: ['в', 'и', 'не', 'на', 'я', 'быть', 'с', 'со', 'а', 'как', 'по', 'это', 'от', 'за', 'к', 'до', 'из', 'у', 'о', 'для'] },
    'zh': { name: 'Chinese', nativeName: '中文', direction: 'ltr' as const, patterns: ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去'] },
    'ja': { name: 'Japanese', nativeName: '日本語', direction: 'ltr' as const, patterns: ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある', 'いる', 'も', 'する', 'から', 'な', 'こと', 'として'] },
    'ko': { name: 'Korean', nativeName: '한국어', direction: 'ltr' as const, patterns: ['이', '가', '을', '를', '에', '의', '로', '으로', '와', '과', '는', '은', '도', '에서', '부터', '까지', '에게', '한테', '께', '보다'] },
    'ar': { name: 'Arabic', nativeName: 'العربية', direction: 'rtl' as const, patterns: ['في', 'من', 'إلى', 'على', 'أن', 'هذا', 'هذه', 'التي', 'الذي', 'كان', 'يكون', 'كانت', 'تكون', 'له', 'لها', 'لهما', 'لهم', 'لهن', 'عنه', 'عنها'] },
    'hi': { name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' as const, patterns: ['का', 'की', 'के', 'में', 'से', 'को', 'पर', 'है', 'हैं', 'था', 'थे', 'थी', 'थीं', 'हो', 'होते', 'होती', 'होतीं', 'था', 'थे', 'थी'] },
    'sa': { name: 'Sanskrit', nativeName: 'संस्कृतम्', direction: 'ltr' as const, patterns: ['तत्', 'सः', 'सा', 'तत्', 'एतत्', 'एषः', 'एषा', 'तस्य', 'तस्याः', 'तस्य', 'तस्मिन्', 'तस्याम्', 'तस्मात्', 'तस्याः', 'तस्मै', 'तस्यै', 'तस्मात्', 'तस्याः', 'तस्मिन्', 'तस्याम्'] },
    'mr': { name: 'Marathi', nativeName: 'मराठी', direction: 'ltr' as const, patterns: ['चा', 'ची', 'चे', 'मध्ये', 'पासून', 'ला', 'वर', 'आहे', 'आहेत', 'होते', 'होती', 'होतो', 'होतात', 'होत', 'होतात', 'होतात', 'होतात', 'होतात', 'होतात', 'होतात'] }
  };

  // Detect language from text content
  static detectLanguage(text: string): LanguageInfo {
    if (!text || text.length < 10) {
      return { code: 'en', name: 'English', nativeName: 'English', confidence: 0.5, direction: 'ltr' };
    }

    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    const words = cleanText.split(/\s+/).filter(word => word.length > 2);
    
    if (words.length < 5) {
      return { code: 'en', name: 'English', nativeName: 'English', confidence: 0.5, direction: 'ltr' };
    }

    let bestMatch = { code: 'en', score: 0 };
    
    // Score each language based on pattern matching
    Object.entries(this.SUPPORTED_LANGUAGES).forEach(([code, lang]) => {
      let score = 0;
      const patterns = lang.patterns;
      
      patterns.forEach(pattern => {
        const matches = words.filter(word => word === pattern).length;
        score += matches * (1 / patterns.length);
      });
      
      // Normalize score by text length
      const normalizedScore = score / words.length;
      
      if (normalizedScore > bestMatch.score) {
        bestMatch = { code, score: normalizedScore };
      }
    });

    const language = this.SUPPORTED_LANGUAGES[bestMatch.code as keyof typeof this.SUPPORTED_LANGUAGES];
    const confidence = Math.min(bestMatch.score * 10, 1); // Scale to 0-1

    return {
      code: bestMatch.code,
      name: language.name,
      nativeName: language.nativeName,
      confidence,
      direction: language.direction
    };
  }

  // Generate localized content based on detected language
  static generateLocalizedContent(
    originalContent: string,
    documentType: string,
    entities: any,
    topics: string[],
    languageInfo: LanguageInfo
  ): LocalizedContent {
    const localizedSummary = this.generateLocalizedSummary(originalContent, documentType, languageInfo);
    const localizedTopics = this.generateLocalizedTopics(topics, languageInfo);
    const localizedEntities = this.generateLocalizedEntities(entities, languageInfo);
    const localizedDocumentType = this.generateLocalizedDocumentType(documentType, languageInfo);

    return {
      summary: localizedSummary,
      topics: localizedTopics,
      entities: localizedEntities,
      documentType: localizedDocumentType
    };
  }

  // Generate localized summary
  private static generateLocalizedSummary(content: string, documentType: string, languageInfo: LanguageInfo): string {
    const templates = this.getSummaryTemplates(languageInfo.code);
    
    if (languageInfo.code === 'en') {
      return content; // Already in English
    }

    // For other languages, provide a translated summary structure
    const summaryTemplate = templates.summary;
    const documentTypeTranslated = this.translateDocumentType(documentType, languageInfo.code);
    
    return summaryTemplate
      .replace('{documentType}', documentTypeTranslated)
      .replace('{content}', this.translateKeyPhrases(content, languageInfo.code));
  }

  // Generate localized topics
  private static generateLocalizedTopics(topics: string[], languageInfo: LanguageInfo): string[] {
    if (languageInfo.code === 'en') {
      return topics;
    }

    return topics.map(topic => this.translateTopic(topic, languageInfo.code));
  }

  // Generate localized entities
  private static generateLocalizedEntities(entities: any, languageInfo: LanguageInfo): any {
    if (languageInfo.code === 'en') {
      return entities;
    }

    return {
      dates: entities.dates.map((date: string) => this.localizeDate(date, languageInfo.code)),
      emails: entities.emails, // Emails don't need translation
      phones: entities.phones, // Phone numbers don't need translation
      amounts: entities.amounts.map((amount: string) => this.localizeAmount(amount, languageInfo.code)),
      names: entities.names // Names typically don't need translation
    };
  }

  // Generate localized document type
  private static generateLocalizedDocumentType(documentType: string, languageInfo: LanguageInfo): string {
    if (languageInfo.code === 'en') {
      return documentType;
    }

    return this.translateDocumentType(documentType, languageInfo.code);
  }

  // Get summary templates for different languages
  private static getSummaryTemplates(languageCode: string): any {
    const templates = {
      'en': { summary: '**{documentType}**\n\n{content}' },
      'es': { summary: '**{documentType}**\n\n{content}' },
      'fr': { summary: '**{documentType}**\n\n{content}' },
      'de': { summary: '**{documentType}**\n\n{content}' },
      'it': { summary: '**{documentType}**\n\n{content}' },
      'pt': { summary: '**{documentType}**\n\n{content}' },
      'ru': { summary: '**{documentType}**\n\n{content}' },
      'zh': { summary: '**{documentType}**\n\n{content}' },
      'ja': { summary: '**{documentType}**\n\n{content}' },
      'ko': { summary: '**{documentType}**\n\n{content}' },
      'ar': { summary: '**{documentType}**\n\n{content}' },
      'hi': { summary: '**{documentType}**\n\n{content}' },
      'sa': { summary: '**{documentType}**\n\n{content}' },
      'mr': { summary: '**{documentType}**\n\n{content}' }
    };

    return templates[languageCode as keyof typeof templates] || templates['en'];
  }

  // Translate document types
  private static translateDocumentType(documentType: string, languageCode: string): string {
    const translations = {
      'Metro Ticketing Report': {
        'es': 'Informe de Ticketing del Metro',
        'fr': 'Rapport de Billetterie du Métro',
        'de': 'U-Bahn-Ticketing-Bericht',
        'it': 'Rapporto sui Biglietti della Metropolitana',
        'pt': 'Relatório de Bilhetagem do Metrô',
        'ru': 'Отчет о Билетах Метро',
        'zh': '地铁票务报告',
        'ja': '地下鉄チケットレポート',
        'ko': '지하철 티켓팅 보고서',
        'ar': 'تقرير تذاكر المترو',
        'hi': 'मेट्रो टिकटिंग रिपोर्ट',
        'sa': 'मेट्रो टिकटिंग प्रतिवेदनम्',
        'mr': 'मेट्रो टिकटिंग अहवाल'
      },
      'Business Report': {
        'es': 'Informe de Negocios',
        'fr': 'Rapport d\'Affaires',
        'de': 'Geschäftsbericht',
        'it': 'Rapporto Aziendale',
        'pt': 'Relatório de Negócios',
        'ru': 'Деловой Отчет',
        'zh': '商业报告',
        'ja': 'ビジネスレポート',
        'ko': '비즈니스 보고서',
        'ar': 'تقرير الأعمال',
        'hi': 'व्यापार रिपोर्ट',
        'sa': 'व्यापार प्रतिवेदनम्',
        'mr': 'व्यापार अहवाल'
      },
      'Financial Report': {
        'es': 'Informe Financiero',
        'fr': 'Rapport Financier',
        'de': 'Finanzbericht',
        'it': 'Rapporto Finanziario',
        'pt': 'Relatório Financeiro',
        'ru': 'Финансовый Отчет',
        'zh': '财务报告',
        'ja': '財務レポート',
        'ko': '재무 보고서',
        'ar': 'التقرير المالي',
        'hi': 'वित्तीय रिपोर्ट',
        'sa': 'वित्तीय प्रतिवेदनम्',
        'mr': 'वित्तीय अहवाल'
      }
    };

    const typeTranslations = translations[documentType as keyof typeof translations];
    return typeTranslations?.[languageCode as keyof typeof typeTranslations] || documentType;
  }

  // Translate key phrases
  private static translateKeyPhrases(content: string, languageCode: string): string {
    const phraseTranslations = {
      'analysis': {
        'es': 'análisis', 'fr': 'analyse', 'de': 'Analyse', 'it': 'analisi', 'pt': 'análise',
        'ru': 'анализ', 'zh': '分析', 'ja': '分析', 'ko': '분석', 'ar': 'تحليل',
        'hi': 'विश्लेषण', 'sa': 'विश्लेषणम्', 'mr': 'विश्लेषण'
      },
      'report': {
        'es': 'informe', 'fr': 'rapport', 'de': 'Bericht', 'it': 'rapporto', 'pt': 'relatório',
        'ru': 'отчет', 'zh': '报告', 'ja': 'レポート', 'ko': '보고서', 'ar': 'تقرير',
        'hi': 'रिपोर्ट', 'sa': 'प्रतिवेदनम्', 'mr': 'अहवाल'
      },
      'data': {
        'es': 'datos', 'fr': 'données', 'de': 'Daten', 'it': 'dati', 'pt': 'dados',
        'ru': 'данные', 'zh': '数据', 'ja': 'データ', 'ko': '데이터', 'ar': 'البيانات',
        'hi': 'डेटा', 'sa': 'डेटा', 'mr': 'डेटा'
      }
    };

    let translatedContent = content;
    
    Object.entries(phraseTranslations).forEach(([english, translations]) => {
      const translation = translations[languageCode as keyof typeof translations];
      if (translation) {
        const regex = new RegExp(`\\b${english}\\b`, 'gi');
        translatedContent = translatedContent.replace(regex, translation);
      }
    });

    return translatedContent;
  }

  // Translate topics
  private static translateTopic(topic: string, languageCode: string): string {
    const topicTranslations = {
      'Financial Analysis': {
        'es': 'Análisis Financiero', 'fr': 'Analyse Financière', 'de': 'Finanzanalyse',
        'it': 'Analisi Finanziaria', 'pt': 'Análise Financeira', 'ru': 'Финансовый Анализ',
        'zh': '财务分析', 'ja': '財務分析', 'ko': '재무 분석', 'ar': 'التحليل المالي',
        'hi': 'वित्तीय विश्लेषण', 'sa': 'वित्तीय विश्लेषणम्', 'mr': 'वित्तीय विश्लेषण'
      },
      'Performance Metrics': {
        'es': 'Métricas de Rendimiento', 'fr': 'Métriques de Performance', 'de': 'Leistungsmetriken',
        'it': 'Metriche di Performance', 'pt': 'Métricas de Desempenho', 'ru': 'Метрики Производительности',
        'zh': '性能指标', 'ja': 'パフォーマンス指標', 'ko': '성능 지표', 'ar': 'مقاييس الأداء',
        'hi': 'प्रदर्शन मेट्रिक्स', 'sa': 'प्रदर्शन मेट्रिक्स', 'mr': 'प्रदर्शन मेट्रिक्स'
      }
    };

    const translations = topicTranslations[topic as keyof typeof topicTranslations];
    return translations?.[languageCode as keyof typeof translations] || topic;
  }

  // Localize date format
  private static localizeDate(date: string, languageCode: string): string {
    return date; // For now, return as-is
  }

  // Localize amount format
  private static localizeAmount(amount: string, languageCode: string): string {
    return amount; // For now, return as-is
  }

  // Get language-specific UI text
  static getUIText(languageCode: string): any {
    const uiTexts = {
      'en': {
        uploadText: 'Upload a PDF document to start AI analysis',
        askQuestion: 'Ask anything about your document...',
        aiReady: 'AI Ready',
        analyzing: 'Analyzing document...',
        summary: 'Summary',
        keyPoints: 'Key Points',
        entities: 'Entities Found',
        documentStats: 'Document Statistics'
      },
      'es': {
        uploadText: 'Sube un documento PDF para comenzar el análisis de IA',
        askQuestion: 'Pregunta cualquier cosa sobre tu documento...',
        aiReady: 'IA Lista',
        analyzing: 'Analizando documento...',
        summary: 'Resumen',
        keyPoints: 'Puntos Clave',
        entities: 'Entidades Encontradas',
        documentStats: 'Estadísticas del Documento'
      },
      'fr': {
        uploadText: 'Téléchargez un document PDF pour commencer l\'analyse IA',
        askQuestion: 'Posez n\'importe quelle question sur votre document...',
        aiReady: 'IA Prête',
        analyzing: 'Analyse du document...',
        summary: 'Résumé',
        keyPoints: 'Points Clés',
        entities: 'Entités Trouvées',
        documentStats: 'Statistiques du Document'
      },
      'de': {
        uploadText: 'Laden Sie ein PDF-Dokument hoch, um die KI-Analyse zu starten',
        askQuestion: 'Stellen Sie Fragen zu Ihrem Dokument...',
        aiReady: 'KI Bereit',
        analyzing: 'Dokument wird analysiert...',
        summary: 'Zusammenfassung',
        keyPoints: 'Hauptpunkte',
        entities: 'Gefundene Entitäten',
        documentStats: 'Dokumentstatistiken'
      },
      'hi': {
        uploadText: 'AI विश्लेषण शुरू करने के लिए PDF दस्तावेज़ अपलोड करें',
        askQuestion: 'अपने दस्तावेज़ के बारे में कुछ भी पूछें...',
        aiReady: 'AI तैयार',
        analyzing: 'दस्तावेज़ का विश्लेषण...',
        summary: 'सारांश',
        keyPoints: 'मुख्य बिंदु',
        entities: 'मिली इकाइयाँ',
        documentStats: 'दस्तावेज़ आंकड़े'
      },
      'sa': {
        uploadText: 'AI विश्लेषणम् आरम्भं कर्तुं PDF दस्तावेज़म् अपलोड् कर्तुं',
        askQuestion: 'भवतः दस्तावेज़स्य विषये किमपि पृच्छतु...',
        aiReady: 'AI सज्जम्',
        analyzing: 'दस्तावेज़स्य विश्लेषणम्...',
        summary: 'सारांशः',
        keyPoints: 'मुख्यानि बिन्दूनि',
        entities: 'प्राप्ताः इकाइयः',
        documentStats: 'दस्तावेज़ आंकडानि'
      },
      'mr': {
        uploadText: 'AI विश्लेषण सुरू करण्यासाठी PDF दस्तावेज अपलोड करा',
        askQuestion: 'तुमच्या दस्तावेजाबद्दल काहीही विचारा...',
        aiReady: 'AI तयार',
        analyzing: 'दस्तावेजाचे विश्लेषण...',
        summary: 'सारांश',
        keyPoints: 'मुख्य मुद्दे',
        entities: 'सापडलेल्या घटक',
        documentStats: 'दस्तावेज आकडेवारी'
      }
    };

    return uiTexts[languageCode as keyof typeof uiTexts] || uiTexts['en'];
  }
}
