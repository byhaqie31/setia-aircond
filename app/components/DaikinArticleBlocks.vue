<script setup lang="ts">
import type { DaikinBlock } from '~/data/daikin-articles'

defineOptions({ name: 'DaikinArticleBlocks' })
defineProps<{ blocks: DaikinBlock[] }>()
</script>

<template>
  <template v-for="(block, index) in blocks" :key="index">
    <!-- Inline HTML is static article copy from ~/data/daikin-articles: strong and links only. -->
    <p v-if="block.type === 'p'" class="daikin-p" v-html="block.html" />

    <h3 v-else-if="block.type === 'h3'" class="daikin-h3">{{ block.text }}</h3>

    <div v-else-if="block.type === 'list'" class="daikin-list">
      <p v-if="block.label" class="daikin-list__label">{{ block.label }}</p>
      <ul :class="`daikin-list__items daikin-list__items--${block.columns}`">
        <li v-for="item in block.items" :key="item">
          <span class="daikin-list__tick" aria-hidden="true"><span class="icon daikin-icon--check" /></span>
          <span v-html="item" />
        </li>
      </ul>
    </div>

    <dl v-else-if="block.type === 'pairs'" class="daikin-pairs" :class="{ 'daikin-pairs--arrow': block.arrow }">
      <div v-for="item in block.items" :key="item.term" class="daikin-pairs__row">
        <dt>{{ item.term }}</dt>
        <span v-if="block.arrow" class="icon icon--arrow daikin-pairs__arrow" aria-hidden="true" />
        <dd>{{ item.detail }}</dd>
      </div>
    </dl>

    <div v-else-if="block.type === 'table'" class="daikin-table" role="region" :aria-label="block.head.join(', ')" tabindex="0">
      <table>
        <thead>
          <tr><th v-for="cell in block.head" :key="cell" scope="col">{{ cell }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in block.rows" :key="rowIndex">
            <template v-for="(cell, cellIndex) in row" :key="cellIndex">
              <th v-if="cellIndex === 0" scope="row" :data-label="block.head[0]"><span v-html="cell" /></th>
              <td v-else :data-label="block.head[cellIndex]"><span v-html="cell" /></td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>

    <ol
      v-else-if="block.type === 'steps'"
      class="daikin-steps"
      :class="{ 'daikin-steps--numbered': block.numbered, 'daikin-steps--compact': block.compact }"
    >
      <li v-for="(item, itemIndex) in block.items" :key="item.title" class="daikin-step">
        <span v-if="block.numbered" class="daikin-step__number" aria-hidden="true">{{ itemIndex + 1 }}</span>
        <div class="daikin-step__body">
          <h3>{{ item.title }}</h3>
          <DaikinArticleBlocks :blocks="item.blocks" />
        </div>
      </li>
    </ol>

    <div v-else-if="block.type === 'faq'" class="daikin-faq">
      <details v-for="item in block.items" :key="item.question" class="daikin-faq__item">
        <summary>
          <h3>{{ item.question }}</h3>
          <span class="daikin-faq__toggle" aria-hidden="true"><span class="icon daikin-icon--plus" /></span>
        </summary>
        <div class="daikin-faq__answer"><DaikinArticleBlocks :blocks="item.blocks" /></div>
      </details>
    </div>
  </template>
</template>

<style scoped>
.daikin-icon--check { --icon: url('/icons/check.svg'); }
.daikin-icon--plus { --icon: url('/icons/plus.svg'); }

.daikin-p { margin: 0 0 1.15em; }
.daikin-p :deep(strong) { color: var(--ink); font-weight: 600; }
.daikin-p :deep(a), .daikin-list :deep(a) { color: var(--pine-700); text-decoration: underline; text-decoration-color: #16513a66; text-underline-offset: 4px; }
.daikin-p :deep(a:hover) { text-decoration-color: currentColor; }
.daikin-h3 { margin: 2.2em 0 .55em; color: var(--ink); font-size: 21px; font-weight: 600; line-height: 1.35; text-wrap: balance; }

/* Short lists read as a scannable checklist rather than bullets. */
.daikin-list { margin: 1.6em 0 1.8em; }
.daikin-list__label { margin: 0 0 12px; color: var(--pine-700); font-size: 14px; font-weight: 600; }
.daikin-list__items { display: grid; gap: 0 28px; margin: 0; padding: 0; list-style: none; }
.daikin-list__items--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.daikin-list__items--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.daikin-list__items li { display: flex; gap: 12px; align-items: flex-start; padding: 13px 0; border-top: 1px solid var(--line); color: var(--ink); font-size: 16px; line-height: 1.45; }
.daikin-list__tick { display: grid; flex: 0 0 auto; place-items: center; width: 22px; height: 22px; margin-top: 0; border-radius: 50%; background: #d1e4d7; color: var(--pine-700); }
.daikin-list__tick .icon { width: 12px; height: 12px; }

.daikin-pairs { margin: 1.6em 0 1.8em; }
.daikin-pairs__row { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); gap: 20px; align-items: baseline; padding: 16px 0; border-top: 1px solid var(--line); }
.daikin-pairs__row:last-child { border-bottom: 1px solid var(--line); }
.daikin-pairs--arrow .daikin-pairs__row { grid-template-columns: minmax(0, 1fr) 18px minmax(0, 1fr); align-items: center; }
.daikin-pairs dt { color: var(--ink); font-weight: 600; }
.daikin-pairs dd { margin: 0; }
.daikin-pairs__arrow { width: 18px; height: 18px; color: var(--pine-700); }

.daikin-table { margin: 1.8em 0 2em; overflow-x: auto; border: 1px solid #365b4626; border-radius: 4px; background: #fff; }
.daikin-table:focus-visible { outline: 2px solid var(--pine-700); outline-offset: 3px; }
.daikin-table table { width: 100%; border-collapse: collapse; font-size: 15px; line-height: 1.5; font-variant-numeric: tabular-nums; }
.daikin-table th, .daikin-table td { padding: 14px 18px; text-align: left; vertical-align: top; }
.daikin-table thead th { background: #d1e4d7; color: #0b3022; font-size: 13px; font-weight: 600; letter-spacing: .02em; white-space: nowrap; }
.daikin-table tbody tr { border-top: 1px solid #365b461a; transition: background-color .2s ease; }
.daikin-table tbody tr:hover { background: var(--mist); }
.daikin-table tbody th { color: var(--ink); font-weight: 600; }

/* Numbered runs get a serif numeral gutter; unnumbered runs read as a ruled index. */
.daikin-steps { display: grid; gap: 0; margin: 1.8em 0 1.4em; padding: 0; list-style: none; }
.daikin-step { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0 24px; padding: 28px 0 14px; border-top: 1px solid var(--line); }
.daikin-steps--numbered .daikin-step { grid-template-columns: 56px minmax(0, 1fr); }
.daikin-step__number { color: var(--pine-700); font-family: Georgia, 'Times New Roman', serif; font-size: 44px; line-height: .9; letter-spacing: -.03em; transition: color .3s ease, transform .4s cubic-bezier(.16, 1, .3, 1); transform-origin: left top; }
.daikin-step:hover .daikin-step__number { color: var(--green); transform: translateY(-3px); }
.daikin-step h3 { margin: 0 0 10px; color: var(--ink); font-size: 20px; font-weight: 600; line-height: 1.35; text-wrap: balance; }
.daikin-step__body > :deep(:last-child) { margin-bottom: 14px; }
.daikin-step__body :deep(.daikin-list), .daikin-step__body :deep(.daikin-pairs) { margin: 1em 0; }
.daikin-steps--compact { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 32px; }
.daikin-steps--compact.daikin-steps--numbered .daikin-step { grid-template-columns: 44px minmax(0, 1fr); gap: 0 16px; }
.daikin-steps--compact .daikin-step__number { font-size: 36px; }
.daikin-steps--compact .daikin-step h3 { font-size: 18px; }
.daikin-steps--compact .daikin-step :deep(.daikin-p) { font-size: 16px; }

.daikin-faq { margin: 1.6em 0 0; border-bottom: 1px solid var(--line); interpolate-size: allow-keywords; }
.daikin-faq__item { border-top: 1px solid var(--line); }
.daikin-faq__item summary { display: flex; gap: 24px; align-items: center; justify-content: space-between; padding: 22px 0; cursor: pointer; list-style: none; }
.daikin-faq__item summary::-webkit-details-marker { display: none; }
.daikin-faq__item summary:focus-visible { outline: 2px solid var(--pine-700); outline-offset: 4px; }
.daikin-faq__item h3 { margin: 0; color: var(--ink); font-size: 18px; font-weight: 600; line-height: 1.4; transition: color .2s ease; }
.daikin-faq__item summary:hover h3 { color: var(--pine-700); }
.daikin-faq__toggle { display: grid; flex: 0 0 auto; place-items: center; width: 36px; height: 36px; border: 1px solid #16513a40; border-radius: 50%; color: var(--pine-700); transition: background-color .25s ease, color .25s ease, transform .35s cubic-bezier(.16, 1, .3, 1); }
.daikin-faq__toggle .icon { width: 16px; height: 16px; }
.daikin-faq__item summary:hover .daikin-faq__toggle { background: #d1e4d7; }
.daikin-faq__item[open] .daikin-faq__toggle { background: var(--pine-700); color: var(--paper); transform: rotate(45deg); }
.daikin-faq__item::details-content { block-size: 0; overflow: clip; transition: block-size .4s cubic-bezier(.16, 1, .3, 1), content-visibility .4s allow-discrete; }
.daikin-faq__item[open]::details-content { block-size: auto; }
.daikin-faq__answer { padding: 0 60px 10px 0; }

@media (max-width: 640px) {
  .daikin-list__items--2, .daikin-list__items--3 { grid-template-columns: minmax(0, 1fr); }
  .daikin-pairs__row, .daikin-pairs--arrow .daikin-pairs__row { grid-template-columns: minmax(0, 1fr); gap: 4px; }
  .daikin-pairs__arrow { display: none; }
  .daikin-steps--compact { grid-template-columns: minmax(0, 1fr); }
  .daikin-steps--numbered .daikin-step { grid-template-columns: 44px minmax(0, 1fr); gap: 0 14px; }
  .daikin-step__number { font-size: 34px; }
  .daikin-faq__answer { padding-right: 0; }
  /* Tables become labelled stacks so no column scrolls off-screen. */
  .daikin-table { border: 0; background: transparent; }
  .daikin-table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .daikin-table tbody tr { display: block; margin-bottom: 12px; padding: 6px 0; border: 1px solid #365b4626; border-radius: 4px; background: #fff; }
  .daikin-table tbody th, .daikin-table tbody td { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); gap: 12px; padding: 9px 16px; }
  .daikin-table tbody th { background: #d1e4d7; }
  .daikin-table tbody :is(th, td)::before { content: attr(data-label); color: var(--ink-soft); font-size: 13px; font-weight: 600; }
}
@media (prefers-reduced-motion: reduce) {
  .daikin-faq__item::details-content { transition: none; }
  .daikin-step__number, .daikin-faq__toggle { transition: none; }
}
</style>
