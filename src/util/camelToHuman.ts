const re = /([a-z]*)([A-Z]*?)([A-Z][a-z]+)/

export default function camelToHuman (input: string): string {
  const out = input.replace(re, '$1 $2 $3')
  return out.charAt(0).toUpperCase() + out.slice(1)
}
