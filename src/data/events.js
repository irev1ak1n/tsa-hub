export const CATEGORIES = ["Computing & Coding", "Engineering & Design", "Manufacturing & Transportation", "Architecture & Construction", "Digital Media", "Communication & Leadership", "Science & Health", "Business & Marketing"];

export const INTEREST_OPTIONS = [
  "Programming",
  "Game design",
  "Web design",
  "CAD / 3D modeling",
  "Robotics",
  "Video & film",
  "Photography",
  "Graphic design",
  "Public speaking",
  "Writing",
  "Music & audio",
  "Science & biotech",
  "Medicine & health",
  "Business & marketing",
  "Architecture",
  "Aviation & flight",
  "Data & statistics",
  "Making & fabrication",
  "Cars & racing",
  "Teaching",
];

export const SKILL_OPTIONS = [
  "Python / JavaScript",
  "HTML & CSS",
  "Game engines (Unity, Godot)",
  "CAD software (Onshape, Fusion, SolidWorks)",
  "Video editing",
  "Photo editing",
  "Graphic design tools (Figma, Canva)",
  "Research & citations",
  "Presenting to judges",
  "Team leadership",
  "3D printing / fabrication",
  "Audio production",
  "Electronics & circuits",
  "Robotics kits (VEX, LEGO)",
  "Public speaking",
  "Writing",
];

export const MAJOR_OPTIONS = [
  "Computer Science",
  "Software Engineering",
  "Cybersecurity",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Aerospace Engineering",
  "Architecture",
  "Graphic Design",
  "Film & Media",
  "Business / Marketing",
  "Medicine / Pre-Med",
  "Biology / Biotech",
  "Education",
  "Undecided",
];

export let EVENTS = [];

export function setEvents(rows) {
  EVENTS = rows;
}

// Normalizes a raw teamSize value (which may arrive as a number, e.g. `2`,
// or a numeric-looking string, e.g. `"2.0"`) into clean display text.
// A range like "2-4" is left untouched. Shared with
// resolvers/events.js (re-exported from there as `fmtSize`) so both the
// guided-flow team-size label and the free-text answer engine format the
// same way.
export function fmtSize(ts) {
  if (ts == null) return null;
  const n = Number(ts);
  if (Number.isFinite(n) && String(ts).indexOf('-') === -1) return String(Math.round(n));
  return String(ts);
}

export function teamSizeLabel(event) {
  const e = event?.eligibility;
  if (!e) return null;
  const size = e.teamSize != null ? fmtSize(e.teamSize) : e.teamSize;
  if (size && e.individualOk && size !== '1') return `${size} (or solo)`;
  if (size === '1') return 'Individual';
  if (size) return `Team of ${size}`;
  if (e.individualOk) return 'Team or solo';
  return null;
}

export function getEvent(id) {
  return EVENTS.find((e) => e.id === id) || null;
}

export function eventsForDivision(division) {
  return EVENTS.filter((e) => e.division === division);
}