import { createApp, reactive } from "https://unpkg.com/petite-vue?module";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://ngbqkyogyfuicsfzccmo.supabase.co",
  "sb_publishable_btbtmwera16wp29oidFEug_HcSGMo3Q",
);
const overlay = document.getElementById("fade-overlay");
const personIdUrlParam = new URLSearchParams(window.location.search).get(
  "personId",
);
window.history.replaceState({}, document.title, window.location.pathname);

window.App = reactive({
  rows: [],
  isPersonenMode: personIdUrlParam == null,
  orderBy: "upvotes",
  isAscending: false,
  personId: personIdUrlParam,
  getColumnHeaderSortSymbol(column) {
    return App.orderBy == column ? (App.isAscending ? "↑" : "↓") : "";
  },
  async switchMode() {
    overlay.classList.add("show");
    await new Promise((r) => setTimeout(r, 200));
    this.isPersonenMode = !this.isPersonenMode;
    this.orderBy = "upvotes";
    this.isAscending = false;
    this.personId = null;
    await this.fetch();
    overlay.classList.remove("show");
  },
  async sortBy(column) {
    overlay.classList.add("show");
    await new Promise((r) => setTimeout(r, 200));
    if (this.orderBy == column) {
      this.isAscending = !this.isAscending;
    } else {
      this.isAscending = false;
    }
    this.orderBy = column;
    await this.fetch();
    overlay.classList.remove("show");
  },
  async fetch() {
    const view = this.isPersonenMode
      ? "personen_leaderboard"
      : "haikus_leaderboard";
    if (this.personId == null) {
      this.rows = (
        await supabase
          .from(view)
          .select("*")
          .order(this.orderBy, { ascending: this.isAscending })
      ).data;
    } else {
      this.rows = (
        await supabase
          .from(view)
          .select("*")
          .order(this.orderBy, { ascending: this.isAscending })
          .eq("person_id", this.personId)
      ).data;
    }
  },
});

await App.fetch();
createApp(window.App).mount();
