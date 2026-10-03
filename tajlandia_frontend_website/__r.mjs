import { chromium } from "@playwright/test";
import fs from "node:fs";
const sp = process.argv[2];
const token = fs.readFileSync(`${sp}/token.txt`, "utf8").trim();
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
await page.addInitScript((t) => { localStorage.setItem("tajlandia_auth_token", t); localStorage.setItem("tajlandia_user", JSON.stringify({ id: "x", role: "USER" })); }, token);
const logs = [];
page.on("console", (m) => { if (m.type() === "error") logs.push(m.text().slice(0, 100)); });
page.on("requestfailed", (r) => { if (r.url().includes("/api/backend")) logs.push("REQUEST FAILED: " + r.url().split("3000")[1] + " " + r.failure()?.errorText); });
// A: normal load, wait for data.
await page.goto("http://localhost:3000/dashboard/explore", { waitUntil: "networkidle", timeout: 120000 }).catch(() => {});
console.log("A normal load errors:", logs.splice(0));
// B: reload while the map request is still in flight.
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForRequest((r) => r.url().includes("/api/backend/explore/map"), { timeout: 30000 });
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(6000);
console.log("B quick reload errors:", logs.splice(0));
await browser.close();
