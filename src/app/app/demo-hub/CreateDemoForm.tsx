"use client";

import { useActionState, useState } from "react";
import { createDemoAction, type DemoHubState } from "./actions";
import { Button } from "@/components/ui/Button";

const initialState: DemoHubState = { ok: false, message: null };

const US_LOCATIONS = {
  AL: ["Birmingham", "Huntsville", "Mobile", "Montgomery", "Tuscaloosa"],
  AK: ["Anchorage", "Fairbanks", "Juneau"],
  AZ: ["Chandler", "Flagstaff", "Mesa", "Phoenix", "Scottsdale", "Tucson"],
  AR: ["Fayetteville", "Fort Smith", "Little Rock", "Springdale"],
  CA: ["Anaheim", "Bakersfield", "Fresno", "Long Beach", "Los Angeles", "Oakland", "Riverside", "Sacramento", "San Diego", "San Francisco", "San Jose", "Santa Ana", "Stockton"],
  CO: ["Aurora", "Boulder", "Colorado Springs", "Denver", "Fort Collins", "Lakewood", "Pueblo"],
  CT: ["Bridgeport", "Hartford", "New Haven", "Stamford", "Waterbury"],
  DE: ["Dover", "Newark", "Wilmington"],
  DC: ["Washington"],
  FL: ["Fort Lauderdale", "Hialeah", "Jacksonville", "Miami", "Orlando", "St. Petersburg", "Tallahassee", "Tampa"],
  GA: ["Albany", "Athens", "Atlanta", "Augusta", "Columbus", "Macon", "Savannah"],
  HI: ["Hilo", "Honolulu", "Kailua", "Pearl City"],
  ID: ["Boise", "Idaho Falls", "Meridian", "Nampa", "Pocatello"],
  IL: ["Aurora", "Chicago", "Joliet", "Naperville", "Peoria", "Rockford", "Springfield"],
  IN: ["Bloomington", "Evansville", "Fort Wayne", "Indianapolis", "South Bend"],
  IA: ["Cedar Rapids", "Davenport", "Des Moines", "Iowa City", "Sioux City"],
  KS: ["Kansas City", "Lawrence", "Olathe", "Overland Park", "Topeka", "Wichita"],
  KY: ["Bowling Green", "Covington", "Lexington", "Louisville", "Owensboro"],
  LA: ["Alexandria", "Baton Rouge", "Lafayette", "Lake Charles", "Monroe", "New Orleans", "Shreveport"],
  ME: ["Augusta", "Bangor", "Lewiston", "Portland"],
  MD: ["Annapolis", "Baltimore", "Bethesda", "Bowie", "College Park", "Frederick", "Gaithersburg", "Greenbelt", "Hyattsville", "Largo", "Laurel", "Rockville", "Silver Spring", "Upper Marlboro"],
  MA: ["Boston", "Cambridge", "Lowell", "Springfield", "Worcester"],
  MI: ["Ann Arbor", "Detroit", "Flint", "Grand Rapids", "Lansing", "Warren"],
  MN: ["Bloomington", "Duluth", "Minneapolis", "Rochester", "Saint Paul"],
  MS: ["Biloxi", "Gulfport", "Hattiesburg", "Jackson", "Southaven"],
  MO: ["Columbia", "Independence", "Kansas City", "Springfield", "St. Louis"],
  MT: ["Billings", "Bozeman", "Great Falls", "Helena", "Missoula"],
  NE: ["Bellevue", "Grand Island", "Lincoln", "Omaha"],
  NV: ["Carson City", "Henderson", "Las Vegas", "North Las Vegas", "Reno"],
  NH: ["Concord", "Manchester", "Nashua", "Portsmouth"],
  NJ: ["Atlantic City", "Camden", "Elizabeth", "Jersey City", "Newark", "Paterson", "Trenton"],
  NM: ["Albuquerque", "Las Cruces", "Rio Rancho", "Roswell", "Santa Fe"],
  NY: ["Albany", "Buffalo", "New York", "Rochester", "Syracuse", "Yonkers"],
  NC: ["Asheville", "Charlotte", "Durham", "Fayetteville", "Greensboro", "Raleigh", "Wilmington", "Winston-Salem"],
  ND: ["Bismarck", "Fargo", "Grand Forks", "Minot"],
  OH: ["Akron", "Cincinnati", "Cleveland", "Columbus", "Dayton", "Toledo"],
  OK: ["Broken Arrow", "Edmond", "Norman", "Oklahoma City", "Tulsa"],
  OR: ["Bend", "Eugene", "Gresham", "Portland", "Salem"],
  PA: ["Allentown", "Erie", "Harrisburg", "Philadelphia", "Pittsburgh", "Reading", "Scranton"],
  RI: ["Cranston", "Newport", "Pawtucket", "Providence", "Warwick"],
  SC: ["Charleston", "Columbia", "Greenville", "Myrtle Beach", "North Charleston", "Rock Hill"],
  SD: ["Aberdeen", "Brookings", "Pierre", "Rapid City", "Sioux Falls"],
  TN: ["Chattanooga", "Clarksville", "Knoxville", "Memphis", "Murfreesboro", "Nashville"],
  TX: ["Arlington", "Austin", "Corpus Christi", "Dallas", "El Paso", "Fort Worth", "Houston", "Lubbock", "Plano", "San Antonio"],
  UT: ["Ogden", "Provo", "Salt Lake City", "St. George", "West Valley City"],
  VT: ["Burlington", "Montpelier", "Rutland", "South Burlington"],
  VA: ["Alexandria", "Arlington", "Chesapeake", "Norfolk", "Richmond", "Roanoke", "Virginia Beach"],
  WA: ["Bellevue", "Everett", "Olympia", "Seattle", "Spokane", "Tacoma", "Vancouver"],
  WV: ["Charleston", "Huntington", "Morgantown", "Parkersburg", "Wheeling"],
  WI: ["Appleton", "Green Bay", "Kenosha", "Madison", "Milwaukee", "Racine"],
  WY: ["Casper", "Cheyenne", "Gillette", "Laramie"],
} as const;

const STATE_NAMES: Record<keyof typeof US_LOCATIONS, string> = {
  AL:"Alabama", AK:"Alaska", AZ:"Arizona", AR:"Arkansas", CA:"California", CO:"Colorado", CT:"Connecticut", DE:"Delaware", DC:"District of Columbia", FL:"Florida", GA:"Georgia", HI:"Hawaii", ID:"Idaho", IL:"Illinois", IN:"Indiana", IA:"Iowa", KS:"Kansas", KY:"Kentucky", LA:"Louisiana", ME:"Maine", MD:"Maryland", MA:"Massachusetts", MI:"Michigan", MN:"Minnesota", MS:"Mississippi", MO:"Missouri", MT:"Montana", NE:"Nebraska", NV:"Nevada", NH:"New Hampshire", NJ:"New Jersey", NM:"New Mexico", NY:"New York", NC:"North Carolina", ND:"North Dakota", OH:"Ohio", OK:"Oklahoma", OR:"Oregon", PA:"Pennsylvania", RI:"Rhode Island", SC:"South Carolina", SD:"South Dakota", TN:"Tennessee", TX:"Texas", UT:"Utah", VT:"Vermont", VA:"Virginia", WA:"Washington", WV:"West Virginia", WI:"Wisconsin", WY:"Wyoming"
};
const inputClass = "mt-1.5 h-11 w-full rounded-sm border border-line bg-white px-3 text-[14px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/10";

export function CreateDemoForm() {
  const [state, action, pending] = useActionState(createDemoAction, initialState);
  const [selectedState, setSelectedState] = useState<keyof typeof US_LOCATIONS | "">("");
  const [copied, setCopied] = useState<"password" | "all" | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(true);

  async function copyText(text: string, kind: "password" | "all") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setPasswordVisible(false);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      setCopied(kind);
      setPasswordVisible(false);
      window.setTimeout(() => setCopied(null), 1800);
    }
  }

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="text-[12.5px] font-semibold text-ink-2">Organization name
          <input name="organization_name" required className={inputClass} />
        </label>
        <label className="text-[12.5px] font-semibold text-ink-2">Organization type
          <select name="organization_type" defaultValue="VOAD" className={inputClass}>
            <option value="VOAD">VOAD</option><option value="COAD">COAD</option><option>Long-Term Recovery Group</option><option>Nonprofit</option><option>Faith-Based Organization</option><option>Government Agency</option><option>Other</option>
          </select>
        </label>
        <label className="text-[12.5px] font-semibold text-ink-2">State
          <select name="state" required value={selectedState} onChange={(event) => setSelectedState(event.target.value as keyof typeof US_LOCATIONS | "")} className={inputClass}>
            <option value="">Select state</option>
            {Object.entries(STATE_NAMES).map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}
          </select>
        </label>
        <label className="text-[12.5px] font-semibold text-ink-2">City
          <select name="city" required disabled={!selectedState} defaultValue="" key={selectedState} className={inputClass}>
            <option value="">{selectedState ? "Select city" : "Select state first"}</option>
            {selectedState && US_LOCATIONS[selectedState].map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </label>
        <label className="text-[12.5px] font-semibold text-ink-2">Client contact
          <input name="contact_name" className={inputClass} />
        </label>
        <label className="text-[12.5px] font-semibold text-ink-2">Contact email
          <input name="contact_email" type="email" className={inputClass} />
        </label>
        <label className="text-[12.5px] font-semibold text-ink-2">Access duration
          <select name="duration_days" defaultValue="7" className={inputClass}>
            <option value="1">1 day</option><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option>
          </select>
        </label>
      </div>
      {state.message && <div className={`rounded-sm border px-4 py-3 text-[13px] ${state.ok ? "border-green/20 bg-green/10 text-green" : "border-red/20 bg-red/5 text-red"}`}>{state.message}</div>}
      {state.credentials && (
        <div className="rounded-md border border-blue/20 bg-blue-soft p-5">
          <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-blue">Access details</div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div><div className="text-[11px] font-bold text-ink-3">LOGIN</div><div className="mt-1 break-all text-[13px] font-semibold text-navy">{state.credentials.login_email}</div></div>
            <div>
              <div className="text-[11px] font-bold text-ink-3">TEMPORARY PASSWORD</div>
              <div className="mt-1 flex items-center gap-2">
                <div className="break-all font-mono text-[13px] font-bold text-navy">{passwordVisible ? state.credentials.password : "••••••••••••••••••••"}</div>
                <button type="button" onClick={() => setPasswordVisible((visible) => !visible)} className="shrink-0 rounded-sm border border-line bg-white px-2 py-1 text-[11px] font-bold text-navy hover:border-blue">{passwordVisible ? "Hide" : "Show"}</button>
                <button type="button" onClick={() => copyText(state.credentials?.password ?? "", "password")} className="shrink-0 rounded-sm border border-blue/20 bg-white px-2 py-1 text-[11px] font-bold text-blue hover:border-blue">{copied === "password" ? "Copied!" : "Copy"}</button>
              </div>
            </div>
            <div><div className="text-[11px] font-bold text-ink-3">EXPIRES</div><div className="mt-1 text-[13px] font-semibold text-navy">{state.credentials.expires_at ? new Date(state.credentials.expires_at).toLocaleString() : "Not set"}</div></div>
          </div>
          <p className="mt-3 text-[12px] text-ink-3">The password is not stored in the Demo Hub. Copy it before leaving this page.</p>
          <button type="button" onClick={() => copyText(`ReliefBridge demo access\nLogin: ${state.credentials?.login_email ?? ""}\nPassword: ${state.credentials?.password ?? ""}\nExpires: ${state.credentials?.expires_at ? new Date(state.credentials.expires_at).toLocaleString() : ""}\nSign in: https://reliefbridge.net/login`, "all")} className="mt-4 inline-flex h-9 items-center rounded-sm border border-blue/20 bg-white px-3 text-[12.5px] font-bold text-blue hover:border-blue">{copied === "all" ? "Copied!" : "Copy access details"}</button>
        </div>
      )}
      <Button type="submit" size="sm" disabled={pending}>{pending ? "Creating demo..." : "Create demo"}</Button>
    </form>
  );
}
