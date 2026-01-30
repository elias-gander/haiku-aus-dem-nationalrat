import { createApp, reactive } from "https://unpkg.com/petite-vue?module";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
const haikuEl = document.getElementById("haiku");
const supabase = createClient(
  "https://ngbqkyogyfuicsfzccmo.supabase.co",
  "sb_publishable_btbtmwera16wp29oidFEug_HcSGMo3Q",
);
let haikuIdUrlParam = new URLSearchParams(window.location.search).get(
  "haikuId",
);
window.history.replaceState({}, document.title, window.location.pathname);

window.App = reactive({
  currentHaiku: null,
  isContextPresented: false,
  get votesPercentage() {
    const totalVotes = this.currentHaiku.upvotes + this.currentHaiku.downvotes;
    return totalVotes > 0
      ? {
          up: (this.currentHaiku.upvotes / totalVotes) * 100,
          down: (this.currentHaiku.downvotes / totalVotes) * 100,
        }
      : { up: 50, down: 50 };
  },
  get parties() {
    return this.currentHaiku.parties.join(", ");
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
  async loadHaiku() {
    const overlay = document.getElementById("fade-overlay");
    overlay.classList.add("show");
    await new Promise((r) => setTimeout(r, 200));
    const row = (
      await supabase
        .rpc("get_haiku_with_scores", {
          p_anon_id: getAnonId(),
          p_haiku_id: haikuIdUrlParam,
        })
        .select("*")
    ).data[0];
    const { haiku, ...rest } = row;
    const newHaiku = { ...haiku, ...rest };
    haikuIdUrlParam = null;
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = newHaiku.image_url;
    });
    this.currentHaiku = newHaiku;
    this.isContextPresented = false;
    overlay.classList.remove("show");
  },
  async vote(delta) {
    const isUpdatingVote =
      this.currentHaiku.has_voted_up || this.currentHaiku.has_voted_down;
    const { error } = await supabase.from("votes").upsert({
      haiku_id: this.currentHaiku.id,
      anon_id: getAnonId(),
      vote: delta,
    });
    if (!error) {
      this.currentHaiku.has_voted_up = delta == 1;
      this.currentHaiku.has_voted_down = delta == -1;
      if (this.currentHaiku.has_voted_up) {
        this.currentHaiku.upvotes += 1;
        if (isUpdatingVote) {
          this.currentHaiku.downvotes -= 1;
        }
      } else {
        this.currentHaiku.downvotes += 1;
        if (isUpdatingVote) {
          this.currentHaiku.upvotes -= 1;
        }
      }
    }
  },
});

await App.loadHaiku();
new ResizeObserver(updateHaikuFontSize).observe(haikuEl);
new MutationObserver(updateHaikuFontSize).observe(haikuEl, {
  childList: true,
  characterData: true,
  subtree: true,
});
createApp(window.App).mount();

function updateHaikuFontSize() {
  const rootFontSizePx = parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  );
  const maxFontSizeRem = 3;
  const maxFontSizePx = maxFontSizeRem * rootFontSizePx;
  haikuEl.style.fontSize = maxFontSizeRem + "rem";
  const style = getComputedStyle(haikuEl);
  const paddingLeft = parseFloat(style.paddingLeft);
  const paddingRight = parseFloat(style.paddingRight);
  const availableWidth = haikuEl.clientWidth - paddingLeft - paddingRight;
  const longestLine = Math.max(
    ...[...haikuEl.children].map((l) => l.scrollWidth),
  );
  const scale = availableWidth / longestLine;
  if (scale < 1) {
    haikuEl.style.fontSize = (maxFontSizePx * scale) / rootFontSizePx + "rem";
  }
}

function getAnonId() {
  let id = localStorage.getItem("anon_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("anon_id", id);
  }
  return id;
}
