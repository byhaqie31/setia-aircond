<script setup lang="ts">
const company = useCompany()
usePageSeo({
  path: '/enquiry',
  title: `Enquiry — ${company.displayName}`,
  description: 'Request a quote for air conditioning supply, installation, repair or service — send photos on WhatsApp, and size your room with the horsepower calculator.',
})
</script>

<template>
  <div>
    <PageHero crumb="Enquiry" eyebrow="Enquiry" lede="Send an enquiry, or size your room first with the horsepower calculator.">
      Tell us about <em>your space.</em>
    </PageHero>
    <main id="site" class="site">
      <section class="section">
        <div class="wrap enq__grid">
          <EnquiryForm />
          <HpCalculator />
        </div>
      </section>
    </main>
  </div>
</template>
