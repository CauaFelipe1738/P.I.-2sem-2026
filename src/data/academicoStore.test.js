import assert from 'node:assert/strict'
import { normalizeAcademicData } from './academicoStore.js'

assert.deepEqual(normalizeAcademicData('{'), { attendance: [], learning: [] })
assert.deepEqual(normalizeAcademicData('null'), { attendance: [], learning: [] })
assert.deepEqual(normalizeAcademicData({ attendance: {}, learning: null }), { attendance: [], learning: [] })

const attendance = [{ id: 'a1' }]
assert.deepEqual(normalizeAcademicData({ attendance, learning: false }), { attendance, learning: [] })
console.log('4 verificações de normalização concluídas.')
