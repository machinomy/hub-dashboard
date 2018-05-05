export async function getJSON (url: string): Promise<any> {
  const res = await fetch(url, {
    credentials: 'same-origin'
  }).catch((error: any) => {
    console.error(error)
  })
  return res && res.ok === true ? res.json() : Promise.resolve({})
}

export async function postJSON (url: string, data: any): Promise<any> {
  const res = await fetch(url, {
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST',
    credentials: 'same-origin'
  }).catch((error: any) => {
    console.error(error)
  })
  return res && res.ok === true ? res.json() : Promise.resolve({})
}

export function fullHost () {
  return `${window.location.protocol}//${window.location.hostname}:${window.location.port}`
}
