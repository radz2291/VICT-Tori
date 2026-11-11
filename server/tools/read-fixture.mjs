export function readFixture(entries) {
  const [key, ...rest] = process.argv.slice(2);
  if (rest.length || !Object.hasOwn(entries, key)) {
    process.exitCode = 2;
    return;
  }
  process.stdout.write(JSON.stringify({ text: entries[key] }));
}
