export default function isEmpty (object: any): boolean {
  return Object.keys(object).length === 0 && object.constructor === Object
}
