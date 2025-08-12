import { useEffect, useRef } from 'react';
import { useLogger } from '@/utils/logger';

interface ClickTrackerOptions {
  trackAllClicks?: boolean;
  trackSpecificElements?: string[];
  includeFormSubmits?: boolean;
  includeKeyboardEvents?: boolean;
  logLevel?: 'debug' | 'info';
}

export const useClickTracker = (options: ClickTrackerOptions = {}) => {
  const logger = useLogger();
  const isTracking = useRef(false);

  const {
    trackAllClicks = true,
    trackSpecificElements = [],
    includeFormSubmits = true,
    includeKeyboardEvents = false,
    logLevel = 'info'
  } = options;

  useEffect(() => {
    if (isTracking.current) return;
    
    isTracking.current = true;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const elementInfo = getElementInfo(target);
      
      if (shouldTrackElement(target, trackAllClicks, trackSpecificElements)) {
        const clickData = {
          type: 'click',
          element: elementInfo,
          coordinates: {
            x: event.clientX,
            y: event.clientY,
            pageX: event.pageX,
            pageY: event.pageY
          },
          button: event.button,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
          metaKey: event.metaKey,
          timestamp: Date.now(),
          url: window.location.href
        };

        logger[logLevel](`👆 CLICK: ${elementInfo.tagName}${elementInfo.id ? '#' + elementInfo.id : ''}${elementInfo.className ? '.' + elementInfo.className.split(' ').join('.') : ''} "${elementInfo.textContent?.substring(0, 30) || ''}"`, clickData);
      }
    };

    const handleSubmit = (event: SubmitEvent) => {
      if (!includeFormSubmits) return;
      
      const target = event.target as HTMLFormElement;
      const formData = new FormData(target);
      const formFields = Object.fromEntries(formData.entries());
      
      logger[logLevel](`📝 FORM SUBMIT: ${target.id || target.name || 'unnamed'} -> ${target.action || 'current page'}`, {
        type: 'form_submit',
        formId: target.id,
        formName: target.name,
        formAction: target.action,
        formMethod: target.method,
        fieldsCount: Object.keys(formFields).length,
        fieldNames: Object.keys(formFields),
        timestamp: Date.now(),
        url: window.location.href
      });
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (!includeKeyboardEvents) return;
      
      // Apenas teclas importantes para navegação/ação
      const importantKeys = ['Enter', 'Escape', 'Tab', 'Space', 'F5'];
      if (importantKeys.includes(event.key) || event.ctrlKey || event.altKey) {
        const target = event.target as HTMLElement;
        
        logger[logLevel](`⌨️ KEY: ${event.key} ${event.ctrlKey ? '+Ctrl' : ''}${event.altKey ? '+Alt' : ''}${event.shiftKey ? '+Shift' : ''} on ${target.tagName}`, {
          type: 'keydown',
          key: event.key,
          code: event.code,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
          metaKey: event.metaKey,
          target: getElementInfo(target),
          timestamp: Date.now(),
          url: window.location.href
        });
      }
    };

    const handleError = (event: ErrorEvent) => {
      logger.error(`💥 JAVASCRIPT ERROR: ${event.message} in ${event.filename}:${event.lineno}`, {
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        timestamp: Date.now(),
        url: window.location.href
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error(`💥 PROMISE REJECTION: ${event.reason}`, {
        type: 'promise_rejection',
        reason: event.reason,
        timestamp: Date.now(),
        url: window.location.href
      });
    };

    // Adicionar event listeners
    document.addEventListener('click', handleClick, true);
    
    if (includeFormSubmits) {
      document.addEventListener('submit', handleSubmit, true);
    }
    
    if (includeKeyboardEvents) {
      document.addEventListener('keydown', handleKeydown, true);
    }
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    logger.info('🎯 CLICK TRACKER ATIVO - Monitoramento completo de interações iniciado', {
      options,
      trackingStarted: Date.now(),
      features: {
        clicks: trackAllClicks,
        forms: includeFormSubmits,
        keyboard: includeKeyboardEvents,
        errors: true
      }
    });

    // Cleanup
    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('submit', handleSubmit, true);
      document.removeEventListener('keydown', handleKeydown, true);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      isTracking.current = false;
    };
  }, [trackAllClicks, trackSpecificElements, includeFormSubmits, includeKeyboardEvents, logLevel, logger, options]);

  const trackCustomClick = (elementName: string, additionalData?: Record<string, unknown>) => {
    logger[logLevel](`Custom click: ${elementName}`, {
      type: 'custom_click',
      elementName,
      ...additionalData,
      timestamp: Date.now(),
      url: window.location.href
    });
  };

  return {
    trackCustomClick
  };
};

// Função para obter informações detalhadas do elemento
function getElementInfo(element: HTMLElement) {
  return {
    tagName: element.tagName,
    id: element.id,
    className: element.className,
    textContent: element.textContent?.substring(0, 100),
    attributes: getElementAttributes(element),
    xpath: getXPath(element),
    selector: getCSSSelector(element)
  };
}

// Função para obter atributos do elemento
function getElementAttributes(element: HTMLElement) {
  const attrs: Record<string, string> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attrs[attr.name] = attr.value;
  }
  return attrs;
}

// Função para gerar XPath do elemento
function getXPath(element: HTMLElement): string {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  const parts: string[] = [];
  let current: Element | null = element;
  
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.nodeName.toLowerCase();
    
    if (current.className) {
      selector += `[@class="${current.className}"]`;
    }
    
    parts.unshift(selector);
    current = current.parentElement;
  }
  
  return '/' + parts.join('/');
}

// Função para gerar seletor CSS
function getCSSSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`;
  }
  
  const parts: string[] = [];
  let current: Element | null = element;
  
  while (current && current !== document.body) {
    let selector = current.nodeName.toLowerCase();
    
    if (current.className) {
      selector += '.' + current.className.split(' ').join('.');
    }
    
    parts.unshift(selector);
    current = current.parentElement;
  }
  
  return parts.join(' > ');
}

// Função para determinar se deve rastrear o elemento
function shouldTrackElement(
  element: HTMLElement, 
  trackAllClicks: boolean, 
  trackSpecificElements: string[]
): boolean {
  if (trackAllClicks) return true;
  
  if (trackSpecificElements.length === 0) return false;
  
  return trackSpecificElements.some(selector => {
    if (selector.startsWith('#')) {
      return element.id === selector.substring(1);
    }
    if (selector.startsWith('.')) {
      return element.classList.contains(selector.substring(1));
    }
    return element.tagName.toLowerCase() === selector.toLowerCase();
  });
}
