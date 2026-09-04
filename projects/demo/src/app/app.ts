import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  NgxBorderBeam,
  type BorderBeamColorVariant,
  type BorderBeamSize,
} from 'ngx-border-beam';
import { CopyButton } from './copy-button';
import {
  MockChatInput,
  MockIconButton,
  MockSearchBar,
  MockSubscribeButton,
  MockWorkingCard,
} from './mocks';

type BeamFamily = 'rotate' | 'pulse';

interface Option<T extends string> {
  value: T;
  label: string;
}

const FAMILY_OPTIONS: Option<BeamFamily>[] = [
  { value: 'rotate', label: 'Rotate' },
  { value: 'pulse', label: 'Pulse' },
];

const ROTATE_SIZE_OPTIONS: Option<BorderBeamSize>[] = [
  { value: 'md', label: 'Large' },
  { value: 'sm', label: 'Small' },
  { value: 'line', label: 'Line' },
];

const PULSE_SIZE_OPTIONS: Option<BorderBeamSize>[] = [
  { value: 'pulse-inner', label: 'Pulse Inner' },
  { value: 'pulse-outside', label: 'Pulse Outside' },
];

const DEFAULT_SIZE_BY_FAMILY: Record<BeamFamily, BorderBeamSize> = {
  rotate: 'md',
  pulse: 'pulse-inner',
};

const COLOR_OPTIONS: Option<BorderBeamColorVariant>[] = [
  { value: 'colorful', label: 'Colorful' },
  { value: 'mono', label: 'Mono' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'forest', label: 'Forest' },
  { value: 'candy', label: 'Candy' },
  { value: 'ice', label: 'Ice' },
  { value: 'gold', label: 'Gold' },
];

// URL <-> tab mapping. `/pulse` deep-links to the Pulse tab; everything else
// (including `/`) is Rotate. Paths resolve against <base href> so the demo
// works both at the domain root and under a GitHub Pages sub-path.
const BASE_PATH = new URL(document.baseURI).pathname.replace(/\/$/, '');

function familyFromPath(pathname: string): BeamFamily {
  return /\/pulse\/?$/i.test(pathname) ? 'pulse' : 'rotate';
}

function pathForFamily(family: BeamFamily): string {
  return `${BASE_PATH}/${family === 'pulse' ? 'pulse' : ''}`;
}

const USAGE_CODE = [
  "import { NgxBorderBeam } from 'ngx-border-beam';",
  '',
  '@Component({',
  '  imports: [NgxBorderBeam],',
  '  template: `',
  '    <ngx-border-beam>',
  '      <your-card>Content</your-card>',
  '    </ngx-border-beam>',
  '  `,',
  '})',
  'export class YourComponent {}',
].join('\n');

@Component({
  selector: 'app-root',
  imports: [
    NgxBorderBeam,
    CopyButton,
    MockChatInput,
    MockIconButton,
    MockSearchBar,
    MockSubscribeButton,
    MockWorkingCard,
  ],
  templateUrl: './app.html',
})
export class App {
  protected readonly familyOptions = FAMILY_OPTIONS;
  protected readonly colorOptions = COLOR_OPTIONS;

  protected readonly family = signal<BeamFamily>(familyFromPath(window.location.pathname));
  protected readonly playgroundActive = signal(true);
  protected readonly playgroundSize = signal<BorderBeamSize>(
    DEFAULT_SIZE_BY_FAMILY[familyFromPath(window.location.pathname)]
  );
  protected readonly playgroundColor = signal<BorderBeamColorVariant>('colorful');
  protected readonly playgroundStrength = signal(70);

  protected readonly isPulse = computed(() => this.family() === 'pulse');
  protected readonly sizeOptions = computed(() =>
    this.family() === 'pulse' ? PULSE_SIZE_OPTIONS : ROTATE_SIZE_OPTIONS
  );
  protected readonly isTunedOutside = computed(() => this.playgroundSize() === 'pulse-outside');

  protected readonly installCmd = 'ng add ngx-border-beam';

  // Link to the original React demo, preserving the active family tab and
  // scrolling to the same section via a scroll-to-text fragment. The /pulse
  // deep link goes through the site's GitHub Pages 404.html redirect, which
  // drops the text fragment - so use the encoded /?/pulse form the fallback
  // itself produces: index.html is served directly and the fragment survives
  // the boot script's replaceState.
  protected readonly reactDocsUrl = computed(() => {
    const path = this.family() === 'pulse' ? '/?/pulse' : '/';
    return `https://beam.jakubantalik.com${path}#:~:text=Installation`;
  });
  protected readonly usageCode = USAGE_CODE;

  protected readonly playgroundCode = computed(() => {
    const strength = this.playgroundStrength();
    const strengthAttr = strength < 100 ? ` [strength]="${strength / 100}"` : '';
    return [
      `<ngx-border-beam size="${this.playgroundSize()}" colorVariant="${this.playgroundColor()}"${strengthAttr}>`,
      '  <your-card>Content</your-card>',
      '</ngx-border-beam>',
    ].join('\n');
  });

  private readonly tabList = viewChild.required<ElementRef<HTMLElement>>('tabList');
  private readonly tabPill = viewChild.required<ElementRef<HTMLElement>>('tabPill');

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Sliding tab pill (transitions.dev - tabs sliding). Snap without a
    // transition on first paint / resize; tween on tab change.
    afterNextRender(() => this.moveTabPill(false));

    const onResize = () => this.moveTabPill(false);
    window.addEventListener('resize', onResize);
    destroyRef.onDestroy(() => window.removeEventListener('resize', onResize));

    // Keep the tab in sync with browser back/forward navigation.
    const onPopState = () => {
      const next = familyFromPath(window.location.pathname);
      this.family.set(next);
      this.playgroundSize.set(DEFAULT_SIZE_BY_FAMILY[next]);
      this.moveTabPill(true);
    };
    window.addEventListener('popstate', onPopState);
    destroyRef.onDestroy(() => window.removeEventListener('popstate', onPopState));
  }

  protected onStrengthInput(e: Event): void {
    this.playgroundStrength.set(parseInt((e.target as HTMLInputElement).value, 10));
  }

  protected setFamily(next: BeamFamily): void {
    this.family.set(next);
    this.playgroundSize.set(DEFAULT_SIZE_BY_FAMILY[next]);
    const path = pathForFamily(next);
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    this.moveTabPill(true);
  }

  // Measures the target tab by index, so it works before change detection
  // has re-rendered the data-active attributes.
  private moveTabPill(animate: boolean): void {
    const pill = this.tabPill().nativeElement;
    const list = this.tabList().nativeElement;
    const idx = FAMILY_OPTIONS.findIndex(o => o.value === this.family());
    const activeTab = list.querySelectorAll<HTMLButtonElement>('.tab-btn')[idx];
    if (!activeTab) return;
    if (!animate) {
      const prev = pill.style.transition;
      pill.style.transition = 'none';
      pill.style.transform = `translateX(${activeTab.offsetLeft}px)`;
      pill.style.width = `${activeTab.offsetWidth}px`;
      void pill.offsetWidth; // force reflow before restoring
      pill.style.transition = prev;
    } else {
      pill.style.transform = `translateX(${activeTab.offsetLeft}px)`;
      pill.style.width = `${activeTab.offsetWidth}px`;
    }
  }
}
