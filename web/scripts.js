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
  loadRandomHaiku() {
    const randomIndex = Math.floor(Math.random() * haiku.length);
    this.currentHaiku = haiku[randomIndex];
    this.isContextPresented = false;
    this.votes = { up: 0, down: 0 };
    this.hasVotedUp = false;
    this.hasVotedDown = false;
  },
});

window.App.loadRandomHaiku();
createApp(window.App).mount();
