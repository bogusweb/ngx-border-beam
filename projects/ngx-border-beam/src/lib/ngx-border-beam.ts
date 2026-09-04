import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { BorderBeamColorVariant, BorderBeamSize, BorderBeamTheme } from './types';
import { generateBeamCSS, getPulseDriverConfig, sizePresets, sizeThemePresets } from './styles';
import { registerPulseInstance } from './pulseDriver';

let nextBeamId = 0;

/**
 * NgxBorderBeam - Animated border beam effect for Angular
 *
 * Angular wrapper for the `border-beam` React component by Jakub Antalik
 * (https://github.com/Jakubantalik). The visual engine (CSS generator and
 * pulse driver) is his work, shared verbatim; this component only adapts
 * the React layer to Angular. Wraps projected content with a per-instance
 * generated stylesheet driving the beam/glow/bloom layers.
 *
 * @example
 * ```html
 * <ngx-border-beam size="md" colorVariant="ocean">
 *   <div class="card">Content</div>
 * </ngx-border-beam>
 * ```
 */
@Component({
  selector: 'ngx-border-beam, [ngxBorderBeam]',
  template: '<ng-content /><div data-beam-bloom></div>',
  styles: ':host { display: block; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-beam]': 'id',
    '[attr.data-active]': 'isActive() && !isFading() ? "" : null',
    '[attr.data-fading]': 'isFading() ? "" : null',
    '[attr.data-paused]': 'isActive() && !isFading() && !isVisible() ? "" : null',
    '[style.--beam-strength]': 'clampedStrength()',
    '[style.--pulse-glow-sx]': 'pulseGlowSx()',
    '[style.--pulse-glow-sy]': 'pulseGlowSy()',
    '(animationend)': 'onAnimationEnd($event)',
  },
})
export class NgxBorderBeam {
  /**
   * Size/type preset
   * Rotate family: 'sm' (compact), 'md' (full border, default), 'line' (bottom traveling).
   * Pulse family: 'pulse-outside' (outward bloom), 'pulse-inner' (contained breathe).
   */
  readonly size = input<BorderBeamSize>('md');

  /** Color variant: 'colorful' (default) | 'mono' | 'ocean' | 'sunset' */
  readonly colorVariant = input<BorderBeamColorVariant>('colorful');

  /** Theme mode; 'auto' follows prefers-color-scheme. @default 'dark' */
  readonly theme = input<BorderBeamTheme>('dark');

  /** Disable the hue-shift animation for static colors (e.g., monochrome) */
  readonly staticColors = input(false, { transform: booleanAttribute });

  /** Rotation/travel duration in seconds. @default 1.96 border / 3.1 line / 2.3 pulse */
  readonly duration = input<number | undefined>(undefined);

  /** Whether the animation is active. @default true */
  readonly active = input(true, { transform: booleanAttribute });

  /**
   * Custom border radius in pixels. When omitted, auto-detects the
   * border-radius of the first projected element; falls back to the preset.
   */
  readonly borderRadius = input<number | undefined>(undefined);

  /** Brightness multiplier for the glow effect. Falls back to the type preset (1.3). */
  readonly brightness = input<number | undefined>(undefined);

  /** Saturation multiplier for the glow effect. @default from theme preset */
  readonly saturation = input<number | undefined>(undefined);

  /** Hue rotation range in degrees for the hue-shift animation. @default 30 */
  readonly hueRange = input(30);

  /**
   * Multiplies the blur radius of every glow layer, so the halo reads
   * tighter (< 1) or wider and softer (> 1). @default 1
   */
  readonly glowSize = input(1);

  /**
   * Extra CSS appended after the beam's own generated stylesheet, so it can
   * override or add layers and keyframes. Write `{id}` wherever the
   * instance id belongs - the root is `[data-beam="{id}"]`, its layers are
   * the `::before` / `::after` pseudo-elements and `[data-beam-bloom]`, and
   * keyframes are named `*-{id}` - and it is substituted per instance.
   */
  readonly css = input<string | undefined>(undefined);

  /** Overall strength/opacity of the effect (0-1); beam layers only. @default 1 */
  readonly strength = input(1);

  /** Emits when the fade-in animation completes */
  readonly activate = output<void>();

  /** Emits when the fade-out animation completes */
  readonly deactivate = output<void>();

  protected readonly id = `ngbb-${nextBeamId++}`;

  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly isActive = signal(true);
  protected readonly isFading = signal(false);
  protected readonly isVisible = signal(true);
  private readonly detectedRadius = signal<number | null>(null);
  private readonly systemTheme = signal<'dark' | 'light'>('dark');
  private readonly pulseGlowScale = signal<{ x: number; y: number }>({ x: 1, y: 1 });

  protected readonly clampedStrength = computed(() =>
    Math.max(0, Math.min(1, this.strength()))
  );
  protected readonly pulseGlowSx = computed(() =>
    this.size() === 'pulse-outside' ? this.pulseGlowScale().x : null
  );
  protected readonly pulseGlowSy = computed(() =>
    this.size() === 'pulse-outside' ? this.pulseGlowScale().y : null
  );

  private readonly resolvedTheme = computed<'dark' | 'light'>(() => {
    const theme = this.theme();
    return theme === 'auto' ? this.systemTheme() : theme;
  });
  private readonly themeConfig = computed(() => sizeThemePresets[this.size()][this.resolvedTheme()]);
  private readonly sizeConfig = computed(() => sizePresets[this.size()]);
  private readonly isPulse = computed(() => {
    const size = this.size();
    return size === 'pulse-inner' || size === 'pulse-outside';
  });

  private readonly finalBorderRadius = computed(
    () => this.borderRadius() ?? this.detectedRadius() ?? this.sizeConfig().borderRadius
  );
  private readonly finalDuration = computed(
    () => this.duration() ?? (this.size() === 'line' ? 3.1 : this.isPulse() ? 2.3 : 1.96)
  );
  private readonly finalSaturation = computed(() => this.saturation() ?? this.themeConfig().saturation);
  private readonly finalBrightness = computed(
    () => this.brightness() ?? this.themeConfig().brightness ?? 1.3
  );
  private readonly finalHueRange = computed(() =>
    this.size() === 'line' ? Math.min(this.hueRange(), 13) : this.hueRange()
  );
  private readonly finalStaticColors = computed(() =>
    this.colorVariant() === 'mono' ? true : this.staticColors()
  );

  private readonly cssStyles = computed(() =>
    generateBeamCSS({
      id: this.id,
      borderRadius: this.finalBorderRadius(),
      borderWidth: this.sizeConfig().borderWidth,
      duration: this.finalDuration(),
      strokeOpacity: this.themeConfig().strokeOpacity,
      innerOpacity: this.themeConfig().innerOpacity,
      bloomOpacity: this.themeConfig().bloomOpacity,
      innerShadow: this.themeConfig().innerShadow,
      size: this.size(),
      colorVariant: this.colorVariant(),
      staticColors: this.finalStaticColors(),
      brightness: this.finalBrightness(),
      saturation: this.finalSaturation(),
      hueRange: this.finalHueRange(),
      theme: this.resolvedTheme(),
      hairlineOpacity: this.themeConfig().hairlineOpacity,
      glowSize: this.glowSize(),
    })
  );

  // Runtime config for the JS breathing driver (null for non-pulse sizes).
  private readonly driverConfig = computed(() =>
    this.isPulse()
      ? getPulseDriverConfig(
          this.size(),
          this.resolvedTheme(),
          this.finalDuration(),
          this.finalHueRange(),
          this.finalStaticColors(),
          this.id
        )
      : null
  );

  constructor() {
    this.isActive.set(this.active());

    // Per-instance stylesheet lives in <head>; Angular templates cannot carry
    // a dynamic <style> tag the way JSX can.
    const styleEl = this.document.createElement('style');
    styleEl.setAttribute('data-border-beam-style', this.id);
    this.document.head.appendChild(styleEl);
    this.destroyRef.onDestroy(() => styleEl.remove());
    effect(() => {
      const extraCss = this.css();
      styleEl.textContent = extraCss
        ? `${this.cssStyles()}\n${extraCss.split('{id}').join(this.id)}`
        : this.cssStyles();
    });

    if (this.isBrowser && typeof window.matchMedia === 'function') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemTheme.set(mediaQuery.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => this.systemTheme.set(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);
      this.destroyRef.onDestroy(() => mediaQuery.removeEventListener('change', handler));
    }

    // active input -> isActive/isFading state machine (mirrors the React port)
    effect(() => {
      const active = this.active();
      if (active && !this.isActive() && !this.isFading()) {
        this.isActive.set(true);
      } else if (!active && this.isActive() && !this.isFading()) {
        this.isFading.set(true);
      }
    });

    // Auto-detect projected child border radius when no explicit value is provided
    effect((onCleanup) => {
      if (!this.isBrowser || this.borderRadius() != null) return;
      const el = this.host.nativeElement;

      const detect = () => {
        const child = this.firstContentChild(el);
        if (!child) return;
        const raw = parseFloat(getComputedStyle(child).borderTopLeftRadius);
        if (!isNaN(raw) && raw > 0) {
          this.detectedRadius.set(raw);
        }
      };

      detect();

      // Re-detect if projected content changes (e.g. rendered late by @if)
      const observer = new MutationObserver(detect);
      observer.observe(el, { childList: true, subtree: false });
      onCleanup(() => observer.disconnect());
    });

    // Pause the (paint-heavy) animations while the element is scrolled offscreen.
    // Never fires activate/deactivate - it only gates painting, not logical state.
    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') return;
      const observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) this.isVisible.set(entry.isIntersecting);
        },
        // Start animating slightly before the element scrolls into view.
        { rootMargin: '256px' }
      );
      observer.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });

    // Pulse Outside glow geometry is authored in fixed pixels for a reference
    // element (~350x140). Measure the wrapped element and scale the glow
    // per-axis so the halo grows/shrinks to fit any component it's applied to.
    effect((onCleanup) => {
      if (this.size() !== 'pulse-outside') {
        this.pulseGlowScale.set({ x: 1, y: 1 });
        return;
      }
      if (!this.isBrowser) return;

      const el = this.host.nativeElement;
      const REF_WIDTH = 350;
      const REF_HEIGHT = 140;
      const MIN_SCALE = 0.35;
      const MAX_SCALE = 4;
      const clamp = (value: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, value));

      const measure = () => {
        const child = this.firstContentChild(el);
        if (!child) return;
        const rect = child.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = +clamp(rect.width / REF_WIDTH).toFixed(3);
        const y = +clamp(rect.height / REF_HEIGHT).toFixed(3);
        this.pulseGlowScale.update(prev => (prev.x === x && prev.y === y ? prev : { x, y }));
      };

      measure();
      if (typeof ResizeObserver === 'undefined') return;

      const child = this.firstContentChild(el);
      if (!child) return;

      const resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(child);
      onCleanup(() => resizeObserver.disconnect());
    });

    // Drive the Pulse breathing from the shared, fps-capped rAF loop while the
    // instance is on, onscreen, and the user hasn't requested reduced motion.
    effect((onCleanup) => {
      const config = this.driverConfig();
      if (!config) return;
      if (!(this.isActive() || this.isFading()) || !this.isVisible()) return;
      if (!this.isBrowser) return;
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

      onCleanup(registerPulseInstance(this.host.nativeElement, config));
    });
  }

  protected onAnimationEnd(e: AnimationEvent): void {
    const animationName = e.animationName;

    if (animationName.includes('fade-out')) {
      this.isActive.set(false);
      this.isFading.set(false);
      this.deactivate.emit();
    } else if (animationName.includes('fade-in')) {
      this.activate.emit();
    }
  }

  /** First projected element, skipping the internal bloom layer. */
  private firstContentChild(el: HTMLElement): HTMLElement | null {
    const child = el.firstElementChild as HTMLElement | null;
    if (!child || child.hasAttribute('data-beam-bloom')) return null;
    return child;
  }
}
