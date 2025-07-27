import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function groupByYear(data, valueAccessor) {
  const groups = Array.from(d3.group(data, d => d.dt.getFullYear()));
  return groups
    .map(([year, values]) => ({
      year,
      value: d3.mean(values, valueAccessor)
    }))
    .sort((a, b) => d3.ascending(a.year, b.year));
}

export function joinOn(primary, lookup, key1, key2, mergeFn) {
  const lookupMap = new Map(lookup.map(d => [d[key2], d]));
  return primary.map(d => {
    const other = lookupMap.get(d[key1]);
    if (mergeFn) {
      return mergeFn(d, other);
    }
    return Object.assign({}, d, other);
  });
}