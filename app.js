(function () {
"use strict";
const KEY = "crumb-diary-v1";
function normalizeState(value) {
const source = value && typeof value === "object" ? value : {};
const safeId = (id) => typeof id === "string" && /^[a-z0-9_-]+$/i.test(id);
const starters = Array.isArray(source.starters)
? source.starters.filter(
(s) => s && safeId(s.id) && typeof s.name === "string",
)
: [];
const feedings = Array.isArray(source.feedings)
? source.feedings.filter(
(f) =>
f &&
safeId(f.id) &&
safeId(f.starterId) &&
!Number.isNaN(Date.parse(f.fedAt)),
)
: [];
return { starters, feedings };
}
function sortFeedings(feedings) {
return feedings
.slice()
.sort((a, b) => Date.parse(b.fedAt) - Date.parse(a.fedAt));
}
function elapsedLabel(iso, now) {
const minutes = Math.max(
0,
Math.floor(((now || new Date()) - new Date(iso)) / 60000),
);
if (minutes < 1) return "just now";
if (minutes < 60) return minutes + "m";
const hours = Math.floor(minutes / 60);
if (hours < 24) return hours + "h " + (minutes % 60) + "m";
return Math.floor(hours / 24) + "d " + (hours % 24) + "h";
}
if (typeof module !== "undefined")
module.exports = { elapsedLabel, normalizeState, sortFeedings };
if (typeof document === "undefined") return;
const $ = (id) => document.getElementById(id);
const els = {
today: $("today"),
strip: $("starterStrip"),
form: $("feedingForm"),
starter: $("starter"),
fedAt: $("fedAt"),
ratio: $("ratio"),
note: $("note"),
noteCount: $("noteCount"),
message: $("formMessage"),
feed: $("feed"),
filter: $("filter"),
dialog: $("starterDialog"),
starterList: $("starterList"),
starterName: $("starterName"),
dialogMessage: $("dialogMessage"),
toast: $("toast"),
};
let state = load();
let toastTimer;
function load() {
try {
return normalizeState(JSON.parse(localStorage.getItem(KEY)));
} catch (_) {
return normalizeState(null);
}
}
function persist() {
try {
localStorage.setItem(KEY, JSON.stringify(state));
return true;
} catch (_) {
showToast("Could not save on this device");
return false;
}
}
function id() {
return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function starterById(starterId) {
return state.starters.find((s) => s.id === starterId);
}
function lastFeeding(starterId) {
return sortFeedings(
state.feedings.filter((f) => f.starterId === starterId),
)[0];
}
function escapeText(value) {
const node = document.createElement("span");
node.textContent = value;
return node.innerHTML;
}
function localInputValue(date) {
const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
return d.toISOString().slice(0, 16);
}
function prettyDate(iso) {
return new Intl.DateTimeFormat(undefined, {
weekday: "short",
month: "short",
day: "numeric",
hour: "numeric",
minute: "2-digit",
}).format(new Date(iso));
}
function showToast(text) {
els.toast.textContent = text;
els.toast.classList.add("show");
clearTimeout(toastTimer);
toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}
function render() {
renderSelectors();
renderStrip();
renderFeed();
renderStarterList();
}
function renderSelectors() {
const selected = els.starter.value;
els.starter.innerHTML = state.starters.length
? state.starters
.map((s) => `<option value="${s.id}">${escapeText(s.name)}</option>`)
.join("")
: '<option value="">Add a starter first</option>';
if (state.starters.some((s) => s.id === selected))
els.starter.value = selected;
const filter = els.filter.value;
els.filter.innerHTML =
'<option value="all">All starters</option>' +
state.starters
.map((s) => `<option value="${s.id}">${escapeText(s.name)}</option>`)
.join("");
if (filter === "all" || state.starters.some((s) => s.id === filter))
els.filter.value = filter;
}
function renderStrip() {
if (!state.starters.length) {
els.strip.innerHTML =
'<div class="empty-strip">No starters yet. Add your first culture to begin the diary.</div>';
return;
}
els.strip.innerHTML = state.starters
.map((s) => {
const last = lastFeeding(s.id);
const ago = last ? elapsedLabel(last.fedAt) : "Never fed";
const hours = last
? (Date.now() - Date.parse(last.fedAt)) / 36e5
: Infinity;
const kind = !last ? " never" : hours < 12 ? " fresh" : "";
return `<article class="starter-card${kind}"><i class="dot"></i><span class="starter-name">${escapeText(s.name)}</span><span class="last-fed">${last ? `last fed <strong>${ago}</strong> ago` : "<strong>Never fed</strong> — log the first"}</span></article>`;
})
.join("");
}
function renderFeed() {
let entries = sortFeedings(state.feedings);
if (els.filter.value !== "all")
entries = entries.filter((f) => f.starterId === els.filter.value);
if (!entries.length) {
els.feed.innerHTML =
'<div class="empty-feed"><div><b>A clean crock.</b><p>Your feeding notes will gather here,<br>newest first.</p></div></div>';
return;
}
els.feed.innerHTML = entries
.map((f) => {
const d = new Date(f.fedAt),
starter = starterById(f.starterId);
const activeClass =
f.activity === "very active"
? " active"
: f.activity === "sluggish"
? " sluggish"
: "";
return `<article class="entry"><div class="date-box"><strong>${d.getDate()}</strong><span>${d.toLocaleString(undefined, { month: "short" })}</span></div><div><h3>${escapeText(starter ? starter.name : "Former starter")}</h3><p class="meta"><span>${prettyDate(f.fedAt)}</span><span class="pill">${escapeText(f.ratio || "—")}</span><span class="pill${activeClass}">${escapeText(f.activity || "normal")}</span></p>${f.note ? `<p class="note">“${escapeText(f.note)}”</p>` : ""}</div><button class="delete" data-delete="${f.id}" aria-label="Delete this feeding" title="Delete">×</button></article>`;
})
.join("");
}
function renderStarterList() {
els.starterList.innerHTML = state.starters.length
? state.starters
.map(
(s) =>
`<div class="manage-row"><span>${escapeText(s.name)}</span><button type="button" data-remove="${s.id}">Remove</button></div>`,
)
.join("")
: '<div class="manage-row"><span>No starters yet</span></div>';
}
function openDialog() {
els.dialogMessage.textContent = "";
els.dialog.showModal
? els.dialog.showModal()
: els.dialog.setAttribute("open", "");
setTimeout(() => els.starterName.focus(), 50);
}
function addStarter() {
const name = els.starterName.value.trim().replace(/\s+/g, " ");
if (!name) {
els.dialogMessage.textContent = "Give your starter a nickname.";
return;
}
if (
state.starters.some((s) => s.name.toLowerCase() === name.toLowerCase())
) {
els.dialogMessage.textContent =
"That starter is already in your collection.";
return;
}
const starter = { id: id(), name };
state.starters.push(starter);
persist();
els.starterName.value = "";
els.dialogMessage.textContent = "";
render();
els.starter.value = starter.id;
showToast(name + " joined the collection");
}
els.form.addEventListener("submit", (event) => {
event.preventDefault();
els.message.textContent = "";
const ratio = els.ratio.value.trim();
if (!state.starters.length) {
els.message.textContent = "Add a starter before logging a feeding.";
openDialog();
return;
}
if (
!/^\s*\d+(?:\.\d+)?\s*:\s*\d+(?:\.\d+)?\s*:\s*\d+(?:\.\d+)?\s*$/.test(
ratio,
) ||
ratio.split(":").some((n) => Number(n) <= 0)
) {
els.message.textContent = "Use a ratio like 1:1:1 or 1:2:2.";
els.ratio.focus();
return;
}
const fedAt = new Date(els.fedAt.value);
if (Number.isNaN(fedAt.getTime())) {
els.message.textContent = "Choose a valid feeding date and time.";
return;
}
const activity = new FormData(els.form).get("activity");
state.feedings.push({
id: id(),
starterId: els.starter.value,
fedAt: fedAt.toISOString(),
ratio: ratio.replace(/\s/g, ""),
activity,
note: els.note.value.trim(),
});
if (persist()) showToast("Feeding saved to the diary");
els.note.value = "";
els.noteCount.textContent = "0 / 180";
els.fedAt.value = localInputValue(new Date());
render();
});
els.feed.addEventListener("click", (event) => {
const button = event.target.closest("[data-delete]");
if (!button) return;
if (confirm("Delete this feeding entry?")) {
state.feedings = state.feedings.filter(
(f) => f.id !== button.dataset.delete,
);
persist();
render();
showToast("Feeding removed");
}
});
els.starterList.addEventListener("click", (event) => {
const button = event.target.closest("[data-remove]");
if (!button) return;
const starter = starterById(button.dataset.remove),
count = state.feedings.filter(
(f) => f.starterId === button.dataset.remove,
).length;
if (
confirm(
`Remove ${starter.name}${count ? ` and its ${count} feeding ${count === 1 ? "entry" : "entries"}` : ""}?`,
)
) {
state.starters = state.starters.filter(
(s) => s.id !== button.dataset.remove,
);
state.feedings = state.feedings.filter(
(f) => f.starterId !== button.dataset.remove,
);
persist();
render();
showToast(starter.name + " removed");
}
});
$("manageBtn").addEventListener("click", openDialog);
$("quickAdd").addEventListener("click", openDialog);
$("addStarter").addEventListener("click", addStarter);
els.starterName.addEventListener("keydown", (event) => {
if (event.key === "Enter") {
event.preventDefault();
addStarter();
}
});
els.note.addEventListener("input", () => {
els.noteCount.textContent = els.note.value.length + " / 180";
});
els.filter.addEventListener("change", renderFeed);
function setMobileView(diary) {
document.body.classList.toggle("diary-view", diary);
$("showLog").classList.toggle("active", !diary);
$("showDiary").classList.toggle("active", diary);
}
$("showLog").addEventListener("click", () => setMobileView(false));
$("showDiary").addEventListener("click", () => setMobileView(true));
els.dialog.addEventListener("click", (event) => {
if (event.target === els.dialog) els.dialog.close();
});
els.today.textContent = new Intl.DateTimeFormat(undefined, {
weekday: "long",
month: "long",
day: "numeric",
}).format(new Date());
els.fedAt.value = localInputValue(new Date());
render();
setInterval(renderStrip, 60000);
})();
