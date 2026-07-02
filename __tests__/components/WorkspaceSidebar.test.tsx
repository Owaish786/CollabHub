import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorkspaceSidebar } from '@/components/layout/WorkspaceSidebar'
import { signOut } from 'next-auth/react'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/workspace/test-workspace-id',
}))

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}))

describe('WorkspaceSidebar', () => {
  const defaultProps = {
    workspaceId: 'test-workspace-id',
    workspaceName: 'Acme Corp',
    workspaceColor: '#ff0000',
    userName: 'John Doe',
    userEmail: 'john@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the workspace name', () => {
    render(<WorkspaceSidebar {...defaultProps} />)
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Workspace')).toBeInTheDocument()
  })

  it('renders the user details', () => {
    render(<WorkspaceSidebar {...defaultProps} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<WorkspaceSidebar {...defaultProps} />)
    const links = screen.getAllByRole('link')
    expect(links.some(link => link.getAttribute('href') === '/workspace/test-workspace-id/tasks')).toBe(true)
    expect(links.some(link => link.getAttribute('href') === '/workspace/test-workspace-id/documents')).toBe(true)
  })

  it('calls signOut when the logout button is clicked', () => {
    render(<WorkspaceSidebar {...defaultProps} />)
    const logoutButton = screen.getByTitle('Sign out')
    fireEvent.click(logoutButton)
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' })
  })
})
