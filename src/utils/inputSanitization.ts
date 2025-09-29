import { SecurityUtils } from './securityConfig';

export interface SanitizationOptions {
  allowHtml: boolean;
  allowScripts: boolean;
  allowStyles: boolean;
  maxLength: number;
  removeEmpty: boolean;
  normalizeWhitespace: boolean;
  escapeHtml: boolean;
  removeUnsafeAttributes: boolean;
}

export interface SanitizationResult {
  sanitized: string;
  removed: string[];
  warnings: string[];
  isSafe: boolean;
}

export class InputSanitizer {
  private defaultOptions: SanitizationOptions = {
    allowHtml: false,
    allowScripts: false,
    allowStyles: false,
    maxLength: 10000,
    removeEmpty: true,
    normalizeWhitespace: true,
    escapeHtml: true,
    removeUnsafeAttributes: true
  };

  sanitize(input: string, options: Partial<SanitizationOptions> = {}): SanitizationResult {
    const opts = { ...this.defaultOptions, ...options };
    const removed: string[] = [];
    const warnings: string[] = [];
    let sanitized = input;

    // Length validation
    if (sanitized.length > opts.maxLength) {
      sanitized = sanitized.substring(0, opts.maxLength);
      warnings.push(`Input truncated to ${opts.maxLength} characters`);
    }

    // Basic XSS protection
    sanitized = SecurityUtils.sanitizeInput(sanitized);

    // Remove or escape HTML based on options
    if (!opts.allowHtml) {
      const htmlRemoved = this.removeHtml(sanitized);
      sanitized = htmlRemoved.sanitized;
      removed.push(...htmlRemoved.removed);
    } else {
      // Sanitize HTML if allowed
      const htmlSanitized = this.sanitizeHtml(sanitized, opts);
      sanitized = htmlSanitized.sanitized;
      removed.push(...htmlSanitized.removed);
    }

    // Remove scripts if not allowed
    if (!opts.allowScripts) {
      const scriptRemoved = this.removeScripts(sanitized);
      sanitized = scriptRemoved.sanitized;
      removed.push(...scriptRemoved.removed);
    }

    // Remove styles if not allowed
    if (!opts.allowStyles) {
      const styleRemoved = this.removeStyles(sanitized);
      sanitized = styleRemoved.sanitized;
      removed.push(...styleRemoved.removed);
    }

    // Normalize whitespace
    if (opts.normalizeWhitespace) {
      sanitized = this.normalizeWhitespace(sanitized);
    }

    // Remove empty elements
    if (opts.removeEmpty) {
      sanitized = this.removeEmptyElements(sanitized);
    }

    // Escape HTML if needed
    if (opts.escapeHtml) {
      sanitized = this.escapeHtml(sanitized);
    }

    // Final safety check
    const isSafe = this.isSafeInput(sanitized);
    if (!isSafe) {
      warnings.push('Input may still contain unsafe content');
    }

    return {
      sanitized,
      removed,
      warnings,
      isSafe
    };
  }

  sanitizeHtml(html: string, options: SanitizationOptions): { sanitized: string; removed: string[] } {
    const removed: string[] = [];
    let sanitized = html;

    // Remove dangerous tags
    const dangerousTags = ['script', 'object', 'embed', 'iframe', 'form', 'input', 'textarea', 'select', 'button'];
    dangerousTags.forEach(tag => {
      const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gi');
      const matches = sanitized.match(regex);
      if (matches) {
        removed.push(...matches);
        sanitized = sanitized.replace(regex, '');
      }
    });

    // Remove dangerous attributes
    if (options.removeUnsafeAttributes) {
      const dangerousAttributes = [
        'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur',
        'onchange', 'onsubmit', 'onreset', 'onselect', 'onkeydown', 'onkeyup',
        'onkeypress', 'onmousedown', 'onmouseup', 'onmousemove', 'onmouseout',
        'oncontextmenu', 'ondrag', 'ondrop', 'onscroll', 'onresize'
      ];
      
      dangerousAttributes.forEach(attr => {
        const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
        const matches = sanitized.match(regex);
        if (matches) {
          removed.push(...matches);
          sanitized = sanitized.replace(regex, '');
        }
      });
    }

    // Remove javascript: and data: URLs
    const urlRegex = /(javascript:|data:)[^"'\s>]+/gi;
    const urlMatches = sanitized.match(urlRegex);
    if (urlMatches) {
      removed.push(...urlMatches);
      sanitized = sanitized.replace(urlRegex, '#');
    }

    return { sanitized, removed };
  }

  removeHtml(input: string): { sanitized: string; removed: string[] } {
    const removed: string[] = [];
    let sanitized = input;

    // Remove HTML tags
    const tagRegex = /<[^>]*>/g;
    const matches = sanitized.match(tagRegex);
    if (matches) {
      removed.push(...matches);
      sanitized = sanitized.replace(tagRegex, '');
    }

    // Decode HTML entities
    sanitized = this.decodeHtmlEntities(sanitized);

    return { sanitized, removed };
  }

  removeScripts(input: string): { sanitized: string; removed: string[] } {
    const removed: string[] = [];
    let sanitized = input;

    // Remove script tags
    const scriptRegex = /<script[^>]*>.*?<\/script>/gi;
    const scriptMatches = sanitized.match(scriptRegex);
    if (scriptMatches) {
      removed.push(...scriptMatches);
      sanitized = sanitized.replace(scriptRegex, '');
    }

    // Remove javascript: URLs
    const jsUrlRegex = /javascript:[^"'\s>]+/gi;
    const jsUrlMatches = sanitized.match(jsUrlRegex);
    if (jsUrlMatches) {
      removed.push(...jsUrlMatches);
      sanitized = sanitized.replace(jsUrlRegex, '#');
    }

    // Remove eval() calls
    const evalRegex = /eval\s*\(/gi;
    const evalMatches = sanitized.match(evalRegex);
    if (evalMatches) {
      removed.push(...evalMatches);
      sanitized = sanitized.replace(evalRegex, '');
    }

    return { sanitized, removed };
  }

  removeStyles(input: string): { sanitized: string; removed: string[] } {
    const removed: string[] = [];
    let sanitized = input;

    // Remove style tags
    const styleRegex = /<style[^>]*>.*?<\/style>/gi;
    const styleMatches = sanitized.match(styleRegex);
    if (styleMatches) {
      removed.push(...styleMatches);
      sanitized = sanitized.replace(styleRegex, '');
    }

    // Remove style attributes
    const styleAttrRegex = /\sstyle\s*=\s*["'][^"']*["']/gi;
    const styleAttrMatches = sanitized.match(styleAttrRegex);
    if (styleAttrMatches) {
      removed.push(...styleAttrMatches);
      sanitized = sanitized.replace(styleAttrRegex, '');
    }

    return { sanitized, removed };
  }

  normalizeWhitespace(input: string): string {
    return input
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
  }

  removeEmptyElements(input: string): string {
    return input
      .replace(/<[^>]*>\s*<\/[^>]*>/g, '') // Remove empty HTML elements
      .replace(/^\s*$/gm, '') // Remove empty lines
      .trim();
  }

  escapeHtml(input: string): string {
    const htmlEscapes: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };

    return input.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
  }

  decodeHtmlEntities(input: string): string {
    const entityRegex = /&[a-zA-Z0-9#]+;/g;
    const entities: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#x27;': "'",
      '&#x2F;': '/',
      '&nbsp;': ' ',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™'
    };

    return input.replace(entityRegex, (match) => entities[match] || match);
  }

  isSafeInput(input: string): boolean {
    // Check for remaining dangerous patterns
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /expression\s*\(/i,
      /url\s*\(/i,
      /@import/i,
      /behavior\s*:/i,
      /-moz-binding/i
    ];

    return !dangerousPatterns.some(pattern => pattern.test(input));
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  sanitizeFileName(fileName: string): string {
    // Remove dangerous characters and normalize
    return fileName
      .replace(/[<>:"/\\|?*]/g, '_') // Replace dangerous characters
      .replace(/\.{2,}/g, '.') // Replace multiple dots
      .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
      .substring(0, 255) // Limit length
      .trim();
  }
}

// Global sanitizer instance
export const inputSanitizer = new InputSanitizer();
