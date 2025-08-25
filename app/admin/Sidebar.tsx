'use client'
import React from 'react'

interface SidebarProps {
  tables?: string[]   // optional, won't crash if empty
  currentTable: string
  onSelectTable: (table: string) => void
}

export default function Sidebar({ tables = [], currentTable, onSelectTable }: SidebarProps) {
  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col h-screen p-4">
      <ul className="flex-1 overflow-auto">
        {/* Buckets always shown */}
        <li
          key="Buckets"
          className={`p-3 mb-2 cursor-pointer rounded ${
            currentTable === 'Buckets' ? 'bg-gray-600 font-bold' : 'hover:bg-gray-700'
          }`}
          onClick={() => onSelectTable('Buckets')}
        >
          Buckets
        </li>

        {/* Admins */}
        <li
          key="Admins"
          className={`p-3 mb-2 cursor-pointer rounded ${
            currentTable === 'admins' ? 'bg-gray-600 font-bold' : 'hover:bg-gray-700'
          }`}
          onClick={() => onSelectTable('admins')}
        >
          Admins
        </li>

        {/* Database tables */}
        {tables.length > 0 ? (
          tables.map((table) => (
            <li
              key={table}
              className={`p-3 mb-2 cursor-pointer rounded ${
                currentTable === table ? 'bg-gray-600 font-bold' : 'hover:bg-gray-700'
              }`}
              onClick={() => onSelectTable(table)}
            >
              {table.replace(/_/g, ' ').toUpperCase()}
            </li>
          ))
        ) : (
          <li className="text-gray-400 p-3 italic">No tables</li>
        )}
      </ul>
    </div>
  )
}
