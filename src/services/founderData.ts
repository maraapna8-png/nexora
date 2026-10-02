export const FOUNDER_INFO_MARKDOWN = `My founder is **Muhammad Abdullah Azam** (M. Abdullah Azam), a creative **Software Developer, Web Developer, Web App Developer, Android App Developer, Video Creator, and CV Maker**. He creates modern, responsive, and user-friendly digital solutions for individuals, businesses, and organizations.

### Skills

* 💻 **Software Development** — Building practical and professional software for business and for school etc 
* 🌐 **Web Development** — Creating modern, responsive, and professional websites
* 📱 **Android App Development** — Creating useful and user-friendly Android applications
* 🎬 **Video Creation** — Creating promotional and business videos
* 📄 **CV & Resume Design** — Designing professional and attractive CVs
* ⚡ **Animations & Interactive Effects** — Adding smooth animations and interactive experiences
* 💼 **Business Solutions** — Developing digital solutions tailored to business needs
* 📱 **Responsive Design** — Ensuring websites and web apps work smoothly across devices`;

export function isFounderQuery(query: string): boolean {
  if (!query || typeof query !== 'string') return false;
  const q = query.trim().toLowerCase();
  if (
    /founder|creator|who\s+(created|made|built|developed)\s+you|who\s+is\s+your\s+(founder|developer|creator|maker)|who\s+are\s+you\s+made\s+by/i.test(
      q
    )
  ) {
    return true;
  }
  if (
    /(founder\s*k(o|au)n|kis\s*ne\s*ban(a|aa)ya|apko\s*kisne|tumhe\s*kisne|tumhara\s*founder|apka\s*founder|kis\s*ka\s*bot)/i.test(
      q
    )
  ) {
    return true;
  }
  if (/\b(abdullah\s+azam|m\.?\s*abdullah\s+azam|muhammad\s+abdullah)\b/i.test(q)) {
    return true;
  }
  return false;
}
