import { ChangeDetectionStrategy, Component, ElementRef, Inject, Input, SimpleChanges } from '@angular/core';
import { SvgIcons } from './types';
import { SvgIconRegistry } from './registry';
import { SVG_CONFIG, SVG_ICONS_CONFIG } from './providers';

@Component({
  selector: 'svg-icon',
  template: '',
  standalone: true,
  host: {
    role: 'img',
    'aria-hidden': 'true',
  },
  styles: [
    `
      :host {
        display: inline-block;
        fill: currentColor;
        width: 1em;
        height: 1em;
        font-size: 1rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SvgIconComponent {
  @Input() key!: SvgIcons;
  @Input() size!: keyof SVG_CONFIG['sizes'];
  @Input() width!: number | string;
  @Input() height!: number | string;
  @Input() fontSize!: number | string;
  @Input() color!: string;
  @Input() noShrink = false;
  @Input() preserveAspectRatio: string | undefined;

  private mergedConfig: SVG_CONFIG;
  private lastKey!: string;
  private init = false;

  constructor(
    private host: ElementRef,
    private registry: SvgIconRegistry,
    @Inject(SVG_ICONS_CONFIG) private config: SVG_CONFIG
  ) {
    this.mergedConfig = this.createConfig();
  }

  get element(): HTMLElement {
    return this.host.nativeElement;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.key) {
      this.setIcon(this.key);
    }

    if (changes.size?.currentValue) {
      this.setIconSize(this.mergedConfig.sizes[this.size]!);
    }

    if (changes.fontSize?.currentValue) {
      this.setIconSize(coerceCssPixelValue(this.fontSize));
    }

    // If on the first change no size was passed, set the default size
    if (!this.init && !changes.size?.currentValue && !changes.fontSize?.currentValue) {
      this.setIconSize(this.mergedConfig.sizes[this.mergedConfig.defaultSize || 'md']!);
    }

    if (changes.width) {
      this.element.style.width = coerceCssPixelValue(this.width);
    }

    if (changes.height) {
      this.element.style.height = coerceCssPixelValue(this.height);
    }

    if (changes.color) {
      this.element.style.color = this.color;
    }

    this.init = true;
  }

  private createConfig() {
    const defaults: SVG_CONFIG = {
      sizes: {
        xs: '0.5rem',
        sm: '0.75rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        xxl: '2.5rem',
      },
    };

    return {
      ...defaults,
      ...this.config,
    };
  }

  private setIconSize(size: string) {
    this.element.style.fontSize = size;
    if (this.noShrink) {
      this.element.style.minWidth = size;
    }
  }

  private setIcon(name: string) {
    const config = { preserveAspectRatio: this.preserveAspectRatio };
    const icon = this.registry.get(name, config) ?? this.registry.get(this.config.missingIconFallback?.name, config);

    if (icon) {
      this.element.setAttribute('aria-label', `${name}-icon`);
      this.element.classList.remove(getIconClassName(this.lastKey));
      this.lastKey = name;
      this.element.classList.add(getIconClassName(name));
      this.element.innerHTML = icon;
    }
  }
}

function coerceCssPixelValue(value: any): string {
  if (value == null) {
    return '';
  }

  return typeof value === 'string' ? value : `${value}px`;
}

function getIconClassName(key: string) {
  return `svg-icon-${key}`;
}
