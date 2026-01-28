import { createApp, reactive } from "https://unpkg.com/petite-vue?module";

const colormap = {
  FPÖ: "#17487e",
  ÖVP: "#63c1d1",
  SPÖ: "#ec1d24",
  GRÜNE: "#88b52a",
  NEOS: "#cc1b68",
  BZÖ: "#ed7e00",
  STRONACH: "#ffe312",
  PILZ: "#cdcdcd",
  "Ohne Klub": "#00000000",
};
const haiku = await (await fetch("../haiku.json")).json();
const haikuEl = document.getElementById("haiku")

window.App = reactive({
  currentHaiku: null,
  isContextPresented: false,
  votes: { up: 0, down: 0 },
  hasVotedUp: false,
  hasVotedDown: false,
  get parties() {
    return this.currentHaiku.parties.length > 0
      ? this.currentHaiku.parties.join(", ")
      : "Ohne Klub";
  },
  get conicGradient() {
    const degPerParty = 360 / this.currentHaiku.parties.length;
    return (
      "conic-gradient(" +
      this.currentHaiku.parties
        .map(
          (party, index) =>
            `${colormap[party]} ${index * degPerParty}deg ${(index + 1) * degPerParty}deg`,
        )
        .join(", ") +
      ")"
    );
  },
  get date() {
    return new Date(this.currentHaiku.date).toLocaleDateString("de-AT");
  },
  toggleIsContextPresented() {
    App.isContextPresented = !App.isContextPresented;
    const el = document.getElementById("context-before");
    el.scrollTop = el.scrollHeight;
  },
  async loadRandomHaiku() {
    const overlay = document.getElementById("fade-overlay");
    overlay.classList.add("show");
    await new Promise(r => setTimeout(r, 250));
    const randomIndex = Math.floor(Math.random() * haiku.length);
    this.currentHaiku = haiku[randomIndex];
    this.isContextPresented = false;
    this.votes = { up: 0, down: 0 };
    this.hasVotedUp = false;
    this.hasVotedDown = false;
    const personImage = document.getElementById("person-image");
    await new Promise(resolve => {
      if (personImage.complete && personImage.naturalWidth !== 0) {
        resolve();
      } else {
        personImage.onload = personImage.onerror = resolve;
      }
    });
    overlay.classList.remove("show");
  }
});

await window.App.loadRandomHaiku();
new ResizeObserver(updateHaikuFontSize).observe(haikuEl);
new MutationObserver(updateHaikuFontSize).observe(haikuEl, {childList: true, characterData: true, subtree: true});

function updateHaikuFontSize() {
  const rootFontSizePx = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const maxFontSizeRem = 3;
  const maxFontSizePx = maxFontSizeRem * rootFontSizePx;
  haikuEl.style.fontSize = maxFontSizeRem + 'rem';
  const style = getComputedStyle(haikuEl);
  const paddingLeft = parseFloat(style.paddingLeft);
  const paddingRight = parseFloat(style.paddingRight);
  const availableWidth = haikuEl.clientWidth - paddingLeft - paddingRight;
  const longestLine = Math.max(
    ...[...haikuEl.children].map(l => l.scrollWidth)
  );
  const scale = availableWidth / longestLine;
  if (scale < 1) {
    haikuEl.style.fontSize = (maxFontSizePx * scale) / rootFontSizePx + 'rem';
  }
}

createApp(window.App).mount();
