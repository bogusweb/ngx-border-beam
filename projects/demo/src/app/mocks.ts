// Shared mock UI examples, ported from the React demo's mocks.tsx. Kept
// presentational and class-driven so all styling lives in styles.css.
// Attribute selectors put the mock's root class directly on the host <div>,
// so NgxBorderBeam's border-radius auto-detection measures the right element.

import { Component } from '@angular/core';

const AT_SIGN_ICON = `
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M10.4 5.59963V8.59962C10.4 9.07701 10.5896 9.53485 10.9272 9.87242C11.2648 10.21 11.7226 10.3996 12.2 10.3996C12.6774 10.3996 13.1352 10.21 13.4728 9.87242C13.8104 9.53485 14 9.07701 14 8.59962V7.99962C13.9999 6.64544 13.5417 5.33111 12.7 4.27035C11.8582 3.20958 10.6823 2.46476 9.36359 2.15701C8.04484 1.84925 6.66076 1.99665 5.43641 2.57525C4.21206 3.15384 3.21944 4.1296 2.61996 5.34386C2.02048 6.55812 1.84939 7.93947 2.13451 9.26329C2.41963 10.5871 3.14419 11.7756 4.19038 12.6354C5.23657 13.4952 6.54286 13.9758 7.89684 13.9991C9.25083 14.0224 10.5729 13.587 11.648 12.7636M10.4 7.99962C10.4 9.32511 9.32549 10.3996 8 10.3996C6.67452 10.3996 5.6 9.32511 5.6 7.99962C5.6 6.67414 6.67452 5.59963 8 5.59963C9.32549 5.59963 10.4 6.67414 10.4 7.99962Z"
      stroke="#808388" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>`;

const CHEVRON_DOWN_ICON = `
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" style="transform: rotate(90deg)">
    <path d="M7 11L10 8L7 5" stroke="#8B9099" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.6" />
  </svg>`;

const ARROW_UP_ICON = `
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 12.6667V3.33333M12.6667 8L8 3.33333L3.33333 8" stroke="#8B8B8B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>`;

const TASK_CIRCLE_ICON = `
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 17.5 17.5" fill="none">
    <circle cx="8.75" cy="8.75" r="8" stroke="#818181" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="3 3" />
  </svg>`;

const SEARCH_ICON = `
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>`;

@Component({
  selector: 'div[mockChatInput]',
  host: { class: 'mock-chat', role: 'img', 'aria-label': 'Chat input UI example with border beam effect' },
  template: `
    <div class="mock-chat-inner">
      <div class="pill">${AT_SIGN_ICON}</div>
      <div class="placeholder">Build anything...</div>
      <div class="bottom-row">
        <div class="tag">Agent ${CHEVRON_DOWN_ICON}</div>
        <div class="tag">Auto ${CHEVRON_DOWN_ICON}</div>
        <div class="send-btn">${ARROW_UP_ICON}</div>
      </div>
    </div>
  `,
})
export class MockChatInput {}

@Component({
  selector: 'div[mockWorkingCard]',
  host: { class: 'mock-working', role: 'img', 'aria-label': 'Agent task list UI example with border beam effect' },
  template: `
    <div class="mock-working-header t-shimmer" data-text="Working...">Working...</div>
    <div class="mock-working-list">
      @for (task of tasks; track task) {
        <div class="mock-working-row">
          ${TASK_CIRCLE_ICON}
          <span>{{ task }}</span>
        </div>
      }
    </div>
  `,
})
export class MockWorkingCard {
  protected readonly tasks = [
    'Generate color palettes',
    'Recommend font pairings',
    'Create layout templates',
    'Build section engine',
    'Generate hero variants',
  ];
}

@Component({
  selector: 'div[mockSubscribeButton]',
  host: { class: 'mock-subscribe', role: 'img', 'aria-label': 'Subscribe button UI example with border beam effect' },
  template: 'Subscribe',
})
export class MockSubscribeButton {}

@Component({
  selector: 'div[mockIconButton]',
  host: { class: 'mock-icon-btn', role: 'img', 'aria-label': 'Icon button UI example with border beam effect' },
  template: '<div class="mock-icon-btn-square"></div>',
})
export class MockIconButton {}

@Component({
  selector: 'div[mockSearchBar]',
  host: { class: 'mock-search', role: 'img', 'aria-label': 'Search bar UI example with border beam effect' },
  template: `
    <div class="mock-search-inner">
      ${SEARCH_ICON}
      <span>Search</span>
    </div>
  `,
})
export class MockSearchBar {}
