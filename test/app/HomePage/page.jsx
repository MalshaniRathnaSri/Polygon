'use client'
import React, { useEffect, useState } from 'react'

function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)) } catch {}
  }, [key, state])
  return [state, setState]
}

export default function Page() {
  const [tasks, setTasks] = useLocalStorage('tasks', [])
  const [title, setTitle] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  function resetForm() { setTitle(''); setEditingId(null); setError('') }

  function validate() {
    if (!title.trim()) { setError('Title is required'); return false }
    if (title.trim().length > 200) { setError('Title too long (max 200 chars)'); return false }
    return true
  }

  function handleSubmit(e) {
    e?.preventDefault()
    if (!validate()) return
    if (editingId) {
      setTasks(tasks.map(t => t.id === editingId ? { ...t, title: title.trim(), updatedAt: Date.now() } : t))
    } else {
      setTasks([{ id: Date.now().toString(), title: title.trim(), createdAt: Date.now() }, ...tasks])
    }
    resetForm()
  }

  function handleEdit(task) {
    setEditingId(task.id)
    setTitle(task.title)
    setError('')
  }
  function handleDelete(id) {
    if (!confirm('Delete this task?')) return
    setTasks(tasks.filter(t => t.id !== id))
  }
  function toggleComplete(id) {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  return (
    <main style={{maxWidth:800, margin:'2rem auto', padding:'1rem'}}>
      <h1>Tasks</h1>
      <form onSubmit={handleSubmit} style={{display:'flex', gap:8, marginBottom:12}}>
        <input
          aria-label="Task title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Buy groceries"
          style={{flex:1, padding:8, fontSize:16}}
        />
        <button type="submit" style={{padding:'8px 12px'}}>{editingId ? 'Update' : 'Add'}</button>
        {editingId && <button type="button" onClick={resetForm} style={{padding:'8px 12px'}}>Cancel</button>}
      </form>
      {error && <div style={{color:'crimson', marginBottom:8}}>{error}</div>}

      <div style={{display:'grid', gap:8}}>
        {tasks.length === 0 && <div>No tasks yet</div>}
        {tasks.map(task => (
          <div key={task.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:10, border:'1px solid #eee', borderRadius:8}}>
            <div style={{display:'flex', alignItems:'center', gap:12}}>
              <input type="checkbox" checked={!!task.done} onChange={() => toggleComplete(task.id)} />
              <div>
                <div style={{textDecoration: task.done ? 'line-through' : 'none'}}>{task.title}</div>
                <small style={{color:'#666'}}>Created: {new Date(task.createdAt).toLocaleString()}</small>
              </div>
            </div>
            <div style={{display:'flex', gap:8}}>
              <button onClick={() => handleEdit(task)} aria-label="Edit">Edit</button>
              <button onClick={() => handleDelete(task.id)} aria-label="Delete">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
