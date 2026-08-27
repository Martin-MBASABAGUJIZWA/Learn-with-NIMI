'use client'
import React from 'react'

interface State { hasError: boolean; message: string }

export class StoryEditorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : 'Unexpected error' }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
            <p className="text-[15px] font-extrabold text-red-700 mb-2">Something went wrong in the Story Editor</p>
            <p className="text-[12px] text-red-500 font-mono mb-5 break-all">{this.state.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="text-[13px] font-bold bg-red-600 text-white px-5 py-2.5 rounded-xl hover:bg-red-700 transition">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
