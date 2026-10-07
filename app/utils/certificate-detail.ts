export interface CertificateDetailPart {
  text: string
  highlight: boolean
}

/** Split a certificate's detail around its highlighted phrase (a grade or class) so it can be marked up. */
export function certificateDetailParts(detail: string, highlight?: string): CertificateDetailPart[] {
  const start = highlight ? detail.indexOf(highlight) : -1
  if (!highlight || start < 0) return [{ text: detail, highlight: false }]
  const end = start + highlight.length
  return [
    { text: detail.slice(0, start), highlight: false },
    { text: highlight, highlight: true },
    { text: detail.slice(end), highlight: false },
  ].filter(part => part.text)
}
