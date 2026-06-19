export function parseCSV(text) {
  const rows = [];
  let row = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(current.trim());
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  if (current.length || row.length) {
    row.push(current.trim());
    if (row.some((cell) => cell !== '')) rows.push(row);
  }

  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim().replace(/^\uFEFF/, ''));
  return rows.slice(1).map((values) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = values[index] ?? '';
    });
    return item;
  });
}

export function normalizeQuestion(raw) {
  return {
    sessionId: raw.sesion || raw.sessionId || 'S1',
    number: Number(raw.numero || raw.number || 0),
    type: raw.tipo || raw.type || 'parrafo',
    prompt: raw.pregunta || raw.prompt || '',
    description: raw.descripcion || raw.description || '',
    required: String(raw.obligatorio || raw.required || 'Sí').toLowerCase().startsWith('s') || String(raw.obligatorio || raw.required).toLowerCase() === 'true',
    points: Number(String(raw.puntaje || raw.points || 0).replace(',', '.')),
    criterion: raw.criterio || raw.criterion || '',
  };
}

export function normalizeLiveQuestion(raw, index = 0) {
  const optionsValue = raw.opciones || raw.options || '';
  return {
    number: Number(raw.numero || raw.number || index + 1),
    type: String(raw.tipo || raw.type || 'short').trim().toLowerCase(),
    prompt: raw.pregunta || raw.prompt || '',
    description: raw.descripcion || raw.description || '',
    options: String(optionsValue).split('|').map((item) => item.trim()).filter(Boolean),
    correctAnswer: raw.respuesta_correcta || raw.correctAnswer || raw.respuesta || '',
    explanation: raw.retroalimentacion || raw.explanation || raw.explicacion || '',
    required: String(raw.obligatorio || raw.required || 'Sí').toLowerCase().startsWith('s')
      || String(raw.obligatorio || raw.required).toLowerCase() === 'true',
    points: Number(String(raw.puntaje || raw.points || 1).replace(',', '.')),
  };
}
