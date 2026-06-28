import { useState, useMemo } from "react";

const FIELD_NAMES = ["Minute", "Hour", "Day", "Month", "Weekday"];
const FIELD_RANGES: [number, number][] = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 6],
];
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface FieldInfo {
  name: string;
  raw: string;
  meaning: string;
  values: number[];
}

interface CronResult {
  fields: FieldInfo[];
  nextRuns: Date[];
  error: string | null;
}

function expandField(expr: string, min: number, max: number): number[] {
  const values = new Set<number>();

  for (const part of expr.split(",")) {
    const stepMatch = part.match(/^(\*|\d+)(?:\/(\d+))$/);
    if (stepMatch) {
      const [, base, stepStr] = stepMatch;
      const step = parseInt(stepStr, 10);
      if (step < 1) throw new Error(`Step must be >= 1 in "${expr}"`);
      const start = base === "*" ? min : parseInt(base, 10);
      if (start < min || start > max) throw new Error(`Value ${start} out of range [${min}-${max}] in "${expr}"`);
      for (let i = start; i <= max; i += step) {
        values.add(i);
      }
      continue;
    }

    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const [, aStr, bStr] = rangeMatch;
      const a = parseInt(aStr, 10);
      const b = parseInt(bStr, 10);
      if (a < min || a > max) throw new Error(`Value ${a} out of range [${min}-${max}] in "${expr}"`);
      if (b < min || b > max) throw new Error(`Value ${b} out of range [${min}-${max}] in "${expr}"`);
      if (a > b) throw new Error(`Range start (${a}) > end (${b}) in "${expr}"`);
      for (let i = a; i <= b; i++) values.add(i);
      continue;
    }

    if (part === "*") {
      for (let i = min; i <= max; i++) values.add(i);
      continue;
    }

    const num = parseInt(part, 10);
    if (isNaN(num)) throw new Error(`Invalid value "${part}" in expression`);
    if (num < min || num > max) throw new Error(`Value ${num} out of range [${min}-${max}] in "${expr}"`);
    values.add(num);
  }

  return Array.from(values).sort((a, b) => a - b);
}

function describeField(values: number[], min: number, max: number, fieldIndex: number): string {
  if (values.length === max - min + 1) return "Every " + FIELD_NAMES[fieldIndex].toLowerCase();

  if (values.length === 1) {
    const v = values[0];
    if (fieldIndex === 4) return WEEKDAY_NAMES[v] + " only";
    if (fieldIndex === 3) return MONTH_NAMES[v] + " only";
    return v.toString();
  }

  const diffs: number[] = [];
  for (let i = 1; i < values.length; i++) diffs.push(values[i] - values[i - 1]);
  const isUniform = diffs.length > 0 && diffs.every((d) => d === diffs[0]);

  if (isUniform && diffs[0] > 1) return `Every ${diffs[0]} ${FIELD_NAMES[fieldIndex].toLowerCase()}s`;
  if (isUniform && diffs[0] === 1) {
    if (values[0] === min && values[values.length - 1] === max) return "Every " + FIELD_NAMES[fieldIndex].toLowerCase();
    return `From ${values[0]} to ${values[values.length - 1]}`;
  }

  return values.join(", ");
}

function matchCronField(values: number[], actual: number): boolean {
  return values.includes(actual);
}

function getNextRuns(cronFields: number[][], count: number): Date[] {
  const now = new Date();
  const runs: Date[] = [];
  let check = new Date(now);
  check.setSeconds(0);
  check.setMilliseconds(0);
  check.setMinutes(check.getMinutes() + 1);

  const maxIterations = 366 * 24 * 60;
  let iterations = 0;

  while (runs.length < count && iterations < maxIterations) {
    const year = check.getFullYear();
    const month = check.getMonth() + 1;
    const day = check.getDate();
    const weekday = check.getDay();
    const hour = check.getHours();
    const minute = check.getMinutes();

    const monthValues = cronFields[3];
    const dayValues = cronFields[2];
    const weekdayValues = cronFields[4];

    const monthOk = matchCronField(monthValues, month);
    const dayOk = matchCronField(dayValues, day);
    const weekdayOk = matchCronField(weekdayValues, weekday);

    if (monthOk && dayOk && weekdayOk) {
      if (matchCronField(cronFields[1], hour) && matchCronField(cronFields[0], minute)) {
        runs.push(new Date(check));
      }
    }

    check.setMinutes(check.getMinutes() + 1);
    iterations++;
  }

  return runs;
}

function parseCronExpression(expr: string): CronResult {
  const trimmed = expr.trim();
  const parts = trimmed.split(/\s+/);

  if (parts.length !== 5) {
    return {
      fields: [],
      nextRuns: [],
      error: `Expected 5 fields (minute hour day month weekday), got ${parts.length}. Separate fields with spaces.`,
    };
  }

  const fields: FieldInfo[] = [];
  const expandedFields: number[][] = [];

  for (let i = 0; i < 5; i++) {
    try {
      const values = expandField(parts[i], FIELD_RANGES[i][0], FIELD_RANGES[i][1]);
      expandedFields.push(values);
      fields.push({
        name: FIELD_NAMES[i],
        raw: parts[i],
        meaning: describeField(values, FIELD_RANGES[i][0], FIELD_RANGES[i][1], i),
        values,
      });
    } catch (e: any) {
      return {
        fields: [],
        nextRuns: [],
        error: `${FIELD_NAMES[i]} field: ${e.message}`,
      };
    }
  }

  const nextRuns = getNextRuns(expandedFields, 5);

  return { fields, nextRuns, error: null };
}

function formatDateTime(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CronParser() {
  const [expression, setExpression] = useState("*/5 * * * *");

  const result = useMemo(() => parseCronExpression(expression), [expression]);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
          Cron Expression
        </label>
        <input
          type="text"
          className="w-full p-3 rounded-lg border text-sm font-mono"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="*/5 * * * *"
        />
        <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
          Format: minute hour day month weekday
        </p>
      </div>

      {result.error && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ backgroundColor: "var(--color-surface)", color: "var(--color-error, #ef4444)", border: "1px solid var(--color-border)" }}
        >
          {result.error}
        </div>
      )}

      {result.fields.length > 0 && (
        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: "var(--color-border)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--color-surface)" }}>
                <th className="px-4 py-2 text-left font-medium" style={{ color: "var(--color-text)" }}>Field</th>
                <th className="px-4 py-2 text-left font-medium" style={{ color: "var(--color-text)" }}>Value</th>
                <th className="px-4 py-2 text-left font-medium" style={{ color: "var(--color-text)" }}>Meaning</th>
              </tr>
            </thead>
            <tbody>
              {result.fields.map((f, i) => (
                <tr key={f.name} style={{ borderTop: "1px solid var(--color-border)" }}>
                  <td className="px-4 py-2 font-medium" style={{ color: "var(--color-text-secondary)" }}>{f.name}</td>
                  <td className="px-4 py-2 font-mono" style={{ color: "var(--color-primary)" }}>{f.raw}</td>
                  <td className="px-4 py-2" style={{ color: "var(--color-text)" }}>{f.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.nextRuns.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
            Next 5 Runs
          </h3>
          <div
            className="rounded-lg border p-4 space-y-2"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
          >
            {result.nextRuns.map((run, i) => (
              <div
                key={i}
                className="flex items-center gap-3"
              >
                <span
                  className="w-5 h-5 rounded-full text-xs flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {i + 1}
                </span>
                <span className="font-mono text-sm" style={{ color: "var(--color-text)" }}>
                  {formatDateTime(run)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
