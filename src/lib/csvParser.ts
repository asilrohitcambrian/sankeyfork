type Flow = {
  id: string
  source: string
  target: string
  value: string
}

export function parseCsvToPairRows(csv: string): Flow[] {
  const lines = csv.split('\n')
  const headers = lines[0].toLowerCase().split(',')
  
  // Validate headers
  if (!headers.includes('source') || !headers.includes('target') || !headers.includes('value')) {
    throw new Error('CSV must have source, target, and value columns')
  }

  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',')
      return {
        id: crypto.randomUUID(),
        source: values[headers.indexOf('source')]?.trim() || '',
        target: values[headers.indexOf('target')]?.trim() || '',
        value: values[headers.indexOf('value')]?.trim() || ''
      }
    })
}

export function parseCsvToPathRows(csv: string): Flow[] {
  const lines = csv.split('\n')
  const headers = lines[0].toLowerCase().split(',')
  
  // Validate headers
  if (!headers.includes('path') || !headers.includes('value')) {
    throw new Error('CSV must have path and value columns')
  }

  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',')
      return {
        id: crypto.randomUUID(),
        source: values[headers.indexOf('path')]?.trim() || '',
        target: '', // Not used in path mode
        value: values[headers.indexOf('value')]?.trim() || ''
      }
    })
} 