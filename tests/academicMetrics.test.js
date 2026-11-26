import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildAcademicReportCsv,
  calcularMediaPonderada,
  calcularTaxaFrequencia,
  isPresencaContabilizada,
} from '../src/utils/academicMetrics.js'

test('isPresencaContabilizada considera PRESENTE e ATRASO como comparecimento', () => {
  assert.equal(isPresencaContabilizada({ statusPresenca: 'PRESENTE' }), true)
  assert.equal(isPresencaContabilizada({ statusPresenca: 'ATRASO' }), true)
  assert.equal(isPresencaContabilizada({ statusPresenca: 'AUSENTE' }), false)
  assert.equal(isPresencaContabilizada({ statusPresenca: 'FALTA_JUSTIFICADA' }), false)
})

test('calcularTaxaFrequencia retorna null para lista vazia e percentual arredondado caso contrário', () => {
  assert.equal(calcularTaxaFrequencia([]), null)
  assert.equal(
    calcularTaxaFrequencia([
      { statusPresenca: 'PRESENTE' },
      { statusPresenca: 'ATRASO' },
      { statusPresenca: 'FALTA_JUSTIFICADA' },
      { statusPresenca: 'AUSENTE' },
    ]),
    50,
  )
})

test('calcularMediaPonderada normaliza notas na escala 0-10 respeitando pesos', () => {
  assert.equal(calcularMediaPonderada([]), null)
  const media = calcularMediaPonderada([
    { nota: 8, valorTotal: 10, peso: 1 },
    { nota: 18, valorTotal: 20, peso: 3 },
  ])
  // (8*1 + 9*3) / 4 = 8.75
  assert.equal(media, 8.75)
})

test('buildAcademicReportCsv gera BOM UTF-8, separador ponto-e-vírgula e escapa aspas', () => {
  const csv = buildAcademicReportCsv({
    cursoNome: 'Sistemas para Internet',
    frequencias: [
      {
        alunoNome: 'Carla "CS"',
        turmaNome: 'TSI-2026-A',
        disciplinaNome: 'Banco de Dados',
        dataAula: '2026-03-02',
        statusPresenca: 'PRESENTE',
      },
    ],
  })
  assert.ok(csv.startsWith('\uFEFF'))
  assert.ok(csv.includes('"Frequência";"Carla ""CS""";"Sistemas para Internet"'))
})
