'use client';

import { useEffect, useRef, useState, useMemo } from "react";
import supabase from "@/lib/supabaseClient";
import { SkeletonTable } from './Skeleton'
import { useToast } from './Toast'
import { Download, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

interface TableViewProps {
  table: string;
}

function formatHeader(key: string) {
  return key.replace(/_/g, ' ')
}

function formatCell(val: unknown) {
  if (val === null || val === undefined) {
    return <span className="text-gray-300">—</span>
  }
  if (typeof val === "boolean") {
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
        val ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
      }`}>
        {val ? 'true' : 'false'}
      </span>
    )
  }
  if (typeof val === "object") {
    return <span className="font-mono text-xs text-gray-500">{JSON.stringify(val)}</span>
  }
  return String(val)
}

function csvValue(val: unknown): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'object') return JSON.stringify(val)
  const s = String(val)
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
}

function downloadCSV(tableName: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => csvValue(row[h])).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${tableName}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function TableView({ table }: TableViewProps) {
  const { error: toastErr } = useToast()
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const highlightRef = useRef<HTMLTableRowElement>(null);

  const [tableName, highlightId] = table.split(':');

  useEffect(() => {
    const fetchRows = async () => {
      setLoading(true);
      setSortCol(null)
      try {
        const lowerName = tableName.toLowerCase();
        const resolvedTable = lowerName === "profiles" || lowerName === "users" ? "parents" : lowerName;
        const { data, error } = await supabase.from(resolvedTable).select("*");
        if (error) throw error;
        setRows(data || []);
      } catch {
        toastErr(`Failed to load table "${tableName}".`);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRows();
  }, [tableName]);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [rows, highlightId]);

  const handleSortClick = (col: string) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const sortedRows = useMemo(() => {
    if (!sortCol) return rows
    return [...rows].sort((a, b) => {
      const av = a[sortCol]; const bv = b[sortCol]
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [rows, sortCol, sortDir])

  const title = tableName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  function SortIcon({ col }: { col: string }) {
    if (sortCol !== col) return <ChevronsUpDown size={12} className="text-gray-300 ml-1 inline flex-shrink-0" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-green-500 ml-1 inline flex-shrink-0" />
      : <ChevronDown size={12} className="text-green-500 ml-1 inline flex-shrink-0" />
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <div className="flex items-center gap-3">
            {!loading && rows.length > 0 && (
              <span className="text-sm font-semibold text-gray-400">
                {rows.length} row{rows.length === 1 ? '' : 's'}
              </span>
            )}
            {!loading && rows.length > 0 && (
              <button
                onClick={() => downloadCSV(tableName, sortedRows)}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700 px-3 py-1.5 rounded-lg transition"
              >
                <Download size={13} /> Export CSV
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-6">
            <SkeletonTable rows={8} cols={5} />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-6 py-10 text-center text-gray-400 text-sm">No data found in {title}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {Object.keys(rows[0]).map((key) => (
                    <th
                      key={key}
                      onClick={() => handleSortClick(key)}
                      className="px-4 py-2.5 text-left font-semibold text-gray-500 uppercase text-xs tracking-wide whitespace-nowrap cursor-pointer hover:text-gray-700 select-none"
                    >
                      {formatHeader(key)}
                      <SortIcon col={key} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedRows.map((row, i) => {
                  const isHighlighted = highlightId !== undefined && String(row.id) === highlightId
                  return (
                    <tr
                      key={i}
                      ref={isHighlighted ? highlightRef : undefined}
                      className={`transition ${isHighlighted ? 'bg-indigo-50 hover:bg-indigo-50' : 'hover:bg-gray-50/70'}`}
                    >
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                          {formatCell(val)}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
