<template>
  <span class="setia-wordmark">
    <span class="setia-wordmark__mark" aria-hidden="true">
      <img :src="$sitePath('/images/brand/setia-original-site.png')" alt="" width="71" height="80">
    </span>
    <span class="setia-wordmark__name">SETIA</span>
    <span class="setia-wordmark__divider" aria-hidden="true" />
    <span class="setia-wordmark__descriptor">AIR-COND &amp; ELECTRICAL</span>
  </span>
</template>

<style scoped>
.setia-wordmark { display: inline-flex; align-items: center; white-space: nowrap; vertical-align: middle; line-height: 1; }
/* Mark and name sit at 80% so the descriptor carries more of the lockup. */
.setia-wordmark__mark { display: grid; flex: 0 0 auto; place-items: center; width: .752em; height: .832em; margin-right: .104em; }
.setia-wordmark__mark img { width: 100%; height: 100%; object-fit: contain; }
.setia-wordmark__name { font-size: .8em; font-weight: 800; letter-spacing: -.045em; }
.setia-wordmark__divider { align-self: center; flex: 0 0 1px; height: .68em; margin: 0 .5em 0 .5em; background: currentColor; opacity: .32; }
.setia-wordmark__descriptor { font-size: max(.3em, 7.5px); font-weight: 700; letter-spacing: .115em; line-height: 1.2; }
</style>
