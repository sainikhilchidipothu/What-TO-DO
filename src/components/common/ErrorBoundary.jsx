import { Component } from 'react'

export class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-black mb-3">Something went wrong</h1>
          <p className="text-zinc-400 mb-5">Your saved data is safe. Reload the app or export a backup before trying again.</p>
          <button className="bg-white text-zinc-950 rounded-lg px-4 py-2 font-bold" onClick={() => window.location.reload()}>RELOAD</button>
        </div>
      </div>
    )
  }
}
