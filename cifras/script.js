// — notas em semitons e equivalências
const NOTES = [
  'C','C#','D','D#','E','F','F#','G','G#','A','A#','B'
];
const EQUIV = { 'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#' };

// tags de seção a destacar
const SECTION_TAGS = /^(intro|other|fade out|end|pre-chorus|Pré-Refrão|chorus|synth|bassline|solo|riff|sad verse|synth bass intro|verso|refrão|ponte|outro|riff|solo|verse|chorus|bridge|other|solo|talk|dialog)$/i;

let semitones = 0;

// referências do DOM
const input            = document.getElementById('input');
const lineNumbers      = document.getElementById('lineNumbers');
const preview          = document.getElementById('preview');
const upBtn            = document.getElementById('up');
const downBtn          = document.getElementById('down');
const semitonesSpan    = document.getElementById('semitones');
const origKeySelect    = document.getElementById('orig-key');
const currentKeyStrong = document.getElementById('current-key');
const titleInput       = document.getElementById('title');
const composerInput    = document.getElementById('composer');
const autorInput       = document.getElementById('letrista');
const downloadBtn      = document.getElementById('download');

// atualiza números de linha
function updateLineNumbers() {
  const count = input.value.split('\n').length;
  lineNumbers.innerHTML = Array.from({ length: count }, (_, i) => i + 1).join('<br>');
}

// transpoe um único acorde
function transposeChord(chord, delta) {
  const m = chord.match(/^([A-G][b#]?)(.*)$/);
  if (!m) return chord;
  let [ , root, rest ] = m;
  const norm = EQUIV[root] || root;
  const idx  = NOTES.indexOf(norm);
  if (idx === -1) return chord;
  let ni = (idx + delta) % NOTES.length;
  if (ni < 0) ni += NOTES.length;
  return NOTES[ni] + rest;
}

// renderiza todo o preview
function render() {
  // — horas e data de criação
  const now        = new Date();
  const hora       = String(now.getHours()).padStart(2, '0');
  const minuto     = String(now.getMinutes()).padStart(2, '0');
  const dia        = String(now.getDate()).padStart(2, '0');
  const mes        = String(now.getMonth() + 1).padStart(2, '0');
  const ano        = now.getFullYear();
  const hora_atual = `${hora}:${minuto}`;
  const data_atual = `${dia}/${mes}/${ano}`;

  // — calcula tom atual
  const orig = origKeySelect.value;
  const norm = EQUIV[orig] || orig;
  let idx    = NOTES.indexOf(norm);
  let curIx  = (idx + semitones) % NOTES.length;
  if (curIx < 0) curIx += NOTES.length;
  currentKeyStrong.textContent = NOTES[curIx];

  // — limpa e insere metadados
  preview.innerHTML = '';
  const meta = document.createElement('div');
  meta.classList.add('song-meta');
  meta.innerHTML = `
    <h2>${titleInput.value || '— Sem título —'}</h2>
    <p>Compositor: ${composerInput.value || '— —'}</p>
    <p>Letrista: ${autorInput.value || '— —'}</p>
    <p>Tom original: ${orig} | Tom atual: ${NOTES[curIx]}</p>
    <p>Criado em ${data_atual} - ${hora_atual}</p>
  `;
  preview.appendChild(meta);

  // — processa cada linha
  input.value.split('\n').forEach(rawLine => {
    const line = rawLine.trim();

    // a) `<breakline>` força nova página
    if (line.toLowerCase() === '<breakline>') {
      const br = document.createElement('div');
      br.classList.add('page-break');
      br.textContent = '— Quebra de Página —';
      preview.appendChild(br);
      return;
    }

    // b) section-labels
    const tagMatch = line.match(/^\[([^\]]+)\]$/);
    if (tagMatch && SECTION_TAGS.test(tagMatch[1])) {
      const lbl = document.createElement('div');
      lbl.classList.add('section-label');
      lbl.textContent = tagMatch[1].toUpperCase();
      preview.appendChild(lbl);
      return;
    }

    // c) tabela de cifras + letras
    const parts = rawLine.split(/(\[[^\]]+\])/g);
    const table = document.createElement('table');
    const rowCh = document.createElement('tr');
    const rowLy = document.createElement('tr');

    parts.forEach(token => {
      const tdC = document.createElement('td');
      const tdL = document.createElement('td');
      tdC.classList.add('cell-chord');
      tdL.classList.add('cell-lyric');
      if (/^\[.+\]$/.test(token)) {
        let chord = token.slice(1, -1);
        chord = transposeChord(chord, semitones);
        tdC.textContent = chord;
        tdL.textContent = '\u00A0';
      } else {
        tdC.textContent = '\u00A0';
        tdL.textContent = token || '\u00A0';
      }
      rowCh.appendChild(tdC);
      rowLy.appendChild(tdL);
    });

    table.appendChild(rowCh);
    table.appendChild(rowLy);
    preview.appendChild(table);
  });
}

// — carrega do localStorage ao iniciar
window.addEventListener('DOMContentLoaded', () => {
  const savedLyrics   = localStorage.getItem('lyrics');
  const savedTitle    = localStorage.getItem('title');
  const savedComposer = localStorage.getItem('composer');
  const savedLyricist = localStorage.getItem('lyricist');
  const savedOrigKey  = localStorage.getItem('origKey');
  if (savedLyrics)   input.value        = savedLyrics;
  if (savedTitle)    titleInput.value   = savedTitle;
  if (savedComposer) composerInput.value= savedComposer;
  if (savedLyricist) autorInput.value   = savedLyricist;
  if (savedOrigKey)  origKeySelect.value= savedOrigKey;
  updateLineNumbers();
  render();
});

// sincroniza scroll dos números com o textarea
input.addEventListener('scroll', () => {
  lineNumbers.scrollTop = input.scrollTop;
});

// — eventos de entrada e transposição
input.addEventListener('input', () => {
  localStorage.setItem('lyrics', input.value);
  updateLineNumbers();
  render();
});
[titleInput, composerInput, autorInput].forEach(el =>
  el.addEventListener('input', () => {
    const key = el === titleInput ? 'title' : el === composerInput ? 'composer' : 'lyricist';
    localStorage.setItem(key, el.value);
    render();
  })
);
origKeySelect.addEventListener('input', () => {
  localStorage.setItem('origKey', origKeySelect.value);
  render();
});
upBtn.addEventListener('click', () => {
  semitones++;
  semitonesSpan.textContent = semitones;
  render();
});
downBtn.addEventListener('click', () => {
  semitones--;
  semitonesSpan.textContent = semitones;
  render();
});

// — download em PDF com margens e quebras automáticas
downloadBtn.addEventListener('click', async () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'pt', 'a4');
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const cw = pw - margin * 2;

  let cursorY = margin;
  const blocks = Array.from(preview.children);

  for (const block of blocks) {
    if (block.classList.contains('page-break')) {
      pdf.addPage();
      cursorY = margin;
      continue;
    }
    const canvas = await html2canvas(block, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const imgW = cw;
    const imgH = (canvas.height * imgW) / canvas.width;
    if (cursorY + imgH > ph - margin) {
      pdf.addPage();
      cursorY = margin;
    }
    pdf.addImage(imgData, 'PNG', margin, cursorY, imgW, imgH);
    cursorY += imgH;
  }

  pdf.save(`${titleInput.value || 'letra_de_musica'}.pdf`);
});

// inicializa
updateLineNumbers();
render();
