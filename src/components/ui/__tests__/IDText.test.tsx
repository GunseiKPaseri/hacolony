import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import IDText from '../IDText'

describe('IDText', () => {
  it('should format long ID correctly', () => {
    const longId = 'user123456789abcdef'
    render(<IDText id={longId} />)

    const expectedText = '@user12...def'
    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })

  it('should format short ID correctly', () => {
    const shortId = 'user1234'
    render(<IDText id={shortId} />)

    const expectedText = '@user12...1234'
    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })

  it('should format very short ID correctly', () => {
    const veryShortId = 'abc'
    render(<IDText id={veryShortId} />)

    // 6文字より短い場合の動作確認
    const expectedText = '@...abc'
    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })

  it('should have correct CSS classes', () => {
    const id = 'test123456789'
    render(<IDText id={id} />)

    const element = screen.getByText('@test12...3789')
    expect(element).toHaveClass('text-gray-400')
  })

  it('should handle exactly 10 character ID', () => {
    const tenCharId = '1234567890'
    render(<IDText id={tenCharId} />)

    const expectedText = '@123456...7890'
    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })

  it('should always include @ symbol', () => {
    const id = 'anyid'
    const { container } = render(<IDText id={id} />)

    expect(container.textContent).toMatch(/^@/)
  })
})