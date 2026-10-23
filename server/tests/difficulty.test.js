
function getNextDifficulty(percentage, currentDifficulty) {
  if (percentage < 40) return 'easy'

  if (percentage >= 80) {
    if (currentDifficulty === 'easy') return 'medium'
    if (currentDifficulty === 'medium') return 'hard'
    return 'hard'
  }

  return currentDifficulty
}

describe('Adaptive difficulty rules', () => {
  test('score below 40% recommends easy', () => {
    expect(getNextDifficulty(20, 'hard')).toBe('easy')
    expect(getNextDifficulty(39, 'medium')).toBe('easy')
  })

  test('80% or more advances easy to medium', () => {
    expect(getNextDifficulty(80, 'easy')).toBe('medium')
    expect(getNextDifficulty(100, 'easy')).toBe('medium')
  })

  test('80% or more advances medium to hard', () => {
    expect(getNextDifficulty(80, 'medium')).toBe('hard')
    expect(getNextDifficulty(100, 'medium')).toBe('hard')
  })

  test('high score at hard remains hard', () => {
    expect(getNextDifficulty(80, 'hard')).toBe('hard')
  })

  test('scores from 40% to 79% maintain the current level', () => {
    expect(getNextDifficulty(40, 'easy')).toBe('easy')
    expect(getNextDifficulty(60, 'medium')).toBe('medium')
    expect(getNextDifficulty(79, 'hard')).toBe('hard')
  })
})
