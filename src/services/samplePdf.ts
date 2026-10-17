/**
 * Generate a real, standards-compliant multi-section PDF binary for the starter "python_roadmap.pdf"
 */
export function generateSamplePythonRoadmapPdfBlob(): Blob {
  const lines = [
    '%PDF-1.4',
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    '4 0 obj << /Length 265 >> stream',
    'BT /F1 18 Tf 50 730 Td (KINETIC PROTOCOL - PYTHON & SYSTEMS ROADMAP) Tj',
    '/F1 11 Tf 0 -32 Td (Phase 1: Core Data Structures, Asymptotic Analysis & Memory Model) Tj',
    '0 -22 Td (Phase 2: C++20 STL, Graphs, Dynamic Programming & Bit Manipulation) Tj',
    '0 -22 Td (Phase 3: Quantitative Backtesting, Vectorized NumPy & Low-Latency I/O) Tj',
    'ET',
    'endstream endobj',
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    'xref',
    '0 6',
    '0000000000 65535 f ',
    '0000000009 00000 n ',
    '0000000058 00000 n ',
    '0000000115 00000 n ',
    '0000000229 00000 n ',
    '0000000546 00000 n ',
    'trailer << /Size 6 /Root 1 0 R >>',
    'startxref',
    '614',
    '%%EOF'
  ];
  return new Blob([lines.join('\n')], { type: 'application/pdf' });
}
