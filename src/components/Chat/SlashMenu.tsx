import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { PromptTemplate } from '@/data/promptTemplates'

interface SlashMenuProps {
  templates: PromptTemplate[]
  activeIndex: number
  onHover: (index: number) => void
  onPick: (template: PromptTemplate) => void
}

/**
 * The "/" template picker. Floats above the composer (absolutely positioned so
 * opening it never shifts the question card underneath) and is driven entirely
 * from the composer's own keydown handler — it owns no keyboard state itself.
 */
export function SlashMenu({ templates, activeIndex, onHover, onPick }: SlashMenuProps) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  return (
    <div className="absolute inset-x-0 bottom-full z-10 mb-2 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      <div className="border-b border-border px-4 py-2 text-xs text-muted-foreground">
        Ready-made answers — pick one, fill in the highlighted bit, send.
      </div>

      {templates.length === 0 ? (
        <div className="px-4 py-3 text-sm text-muted-foreground">Nothing matches that.</div>
      ) : (
        <div ref={listRef} className="flex max-h-[min(42svh,340px)] flex-col overflow-y-auto py-1">
          {templates.map((template, index) => (
            <button
              key={template.id}
              type="button"
              data-active={index === activeIndex}
              onMouseMove={() => onHover(index)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(template)}
              className={cn(
                'flex flex-col gap-0.5 px-4 py-2 text-left',
                index === activeIndex && 'bg-state-bg/60',
              )}
            >
              <span className="text-sm font-medium">{template.label}</span>
              <span className="text-xs leading-snug text-muted-foreground">{template.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
