import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icons'
import { cn, initials as getInitials } from '../lib/utils'

/* --------------------------------------------------------------------------
   Button
   -------------------------------------------------------------------------- */
export function Button({
  children,
  variant = 'secondary',
  size,
  icon,
  iconRight,
  className = '',
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      className={cn(
        'btn',
        `btn--${variant}`,
        size === 'sm' && 'btn--sm',
        size === 'lg' && 'btn--lg',
        !children && 'btn--icon',
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 14 : 16} />}
    </button>
  )
}

export function IconButton({ icon, label, variant, size = 18, className = '', ...rest }) {
  return (
    <button
      type="button"
      className={cn('icon-btn', variant === 'bordered' && 'icon-btn--bordered', className)}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon name={icon} size={size} />
    </button>
  )
}

/* --------------------------------------------------------------------------
   Badge / Chip
   -------------------------------------------------------------------------- */
export function Badge({ children, tone = 'slate', dot = false, className = '' }) {
  return (
    <span className={cn('badge', `badge--${tone}`, className)}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  )
}

export function Chip({ children, tone, icon, className = '' }) {
  return (
    <span className={cn('chip', tone === 'blue' && 'chip--blue', tone === 'green' && 'chip--green', className)}>
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  )
}

/* --------------------------------------------------------------------------
   Avatar
   -------------------------------------------------------------------------- */
export function Avatar({ name = '', size = 'md', color = '#2563EB', src, className = '' }) {
  return (
    <span
      className={cn('avatar', `avatar--${size}`, className)}
      style={{ background: src ? undefined : color }}
      title={name}
    >
      {src ? <img src={src} alt={name} /> : getInitials(name)}
    </span>
  )
}

export function AvatarStack({ people = [], max = 4, size = 'xs' }) {
  const visible = people.slice(0, max)
  const rest = people.length - visible.length
  return (
    <span className="avatar-stack">
      {visible.map((person, index) => (
        <Avatar
          key={`${person.name}-${index}`}
          name={person.name}
          size={size}
          color={person.color}
          className="avatar--ring"
        />
      ))}
      {rest > 0 && <span className="avatar-stack__more">+{rest}</span>}
    </span>
  )
}

/* --------------------------------------------------------------------------
   Stat card
   -------------------------------------------------------------------------- */
export function StatCard({
  label,
  value,
  suffix,
  icon,
  tone = 'blue',
  trend,
  trendTone = 'up',
  sub,
}) {
  return (
    <div className="stat-card">
      <div className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        {icon && (
          <span className={cn('stat-card__icon', `stat-card__icon--${tone}`)}>
            <Icon name={icon} size={18} />
          </span>
        )}
      </div>
      <div className="stat-card__value">
        {value}
        {suffix && <span>{suffix}</span>}
      </div>
      <div className="stat-card__foot">
        {trend && (
          <span className={cn('trend', `trend--${trendTone}`)}>
            <Icon
              name={trendTone === 'down' ? 'arrowDownRight' : 'arrowUpRight'}
              size={13}
              strokeWidth={2.1}
            />
            {trend}
          </span>
        )}
        {sub && <span>{sub}</span>}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------------
   Progress
   -------------------------------------------------------------------------- */
export function Progress({ value = 0, tone, size, className = '', style }) {
  const width = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div
      className={cn('progress', tone && `progress--${tone}`, size === 'lg' && 'progress--lg', className)}
      style={style}
    >
      <div className="progress__bar" style={{ width: `${width}%` }} />
    </div>
  )
}

export function RateCell({ value }) {
  const tone = value >= 90 ? 'green' : value >= 80 ? 'amber' : 'red'
  return (
    <div className="rate-cell">
      <Progress value={value} tone={tone} />
      <span className="rate-cell__value">{value === null ? '—' : `${value}%`}</span>
    </div>
  )
}

/* --------------------------------------------------------------------------
   Fields
   -------------------------------------------------------------------------- */
export function Field({ label, hint, children, full = false, className = '' }) {
  return (
    <label className={cn('field', full && 'field--full', className)}>
      {label && <span className="label">{label}</span>}
      {children}
      {hint && <span className="tiny muted">{hint}</span>}
    </label>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={cn('search-field', className)}>
      <Icon name="search" size={15} />
      <input
        className="input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
      />
    </div>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cn('switch', checked && 'is-on')}
      onClick={() => onChange(!checked)}
    />
  )
}

/* --------------------------------------------------------------------------
   Dropdown / popover
   -------------------------------------------------------------------------- */
export function Dropdown({
  trigger,
  children,
  align = 'right',
  panel = false,
  className = '',
  closeOnClick = true,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className={cn('menu-wrap', className)} ref={ref}>
      <div onClick={() => setOpen((value) => !value)}>{trigger}</div>
      {open && (
        <div
          className={cn(panel ? 'popover' : 'menu', !panel && align === 'left' && 'menu--left')}
          onClick={() => {
            if (closeOnClick) setOpen(false)
          }}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function MenuItem({ icon, children, danger = false, ...rest }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn('menu-item', danger && 'menu-item--danger')}
      {...rest}
    >
      {icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  )
}

/* --------------------------------------------------------------------------
   Modal
   -------------------------------------------------------------------------- */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  width,
  className = '',
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <div
        className={cn('modal', width === 'wide' && 'modal--wide', width === 'narrow' && 'modal--narrow', className)}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal__header">
          <div>
            <h2 className="modal__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {icon && <Icon name={icon} size={19} />}
              {title}
            </h2>
            {subtitle && <p className="modal__sub">{subtitle}</p>}
          </div>
          <IconButton icon="x" label="Close dialog" onClick={onClose} />
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/* --------------------------------------------------------------------------
   Toast
   -------------------------------------------------------------------------- */
const ToastContext = createContext(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (toast) => {
      const entry = typeof toast === 'string' ? { title: toast } : toast
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
      setToasts((current) => [...current, { id, type: 'success', ...entry }])
      window.setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={push}>
      {children}
      {createPortal(
        <div className="toast-stack" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className={cn('toast', `toast--${toast.type}`)}>
              <span className="toast__icon">
                <Icon
                  name={
                    toast.type === 'error'
                      ? 'alertCircle'
                      : toast.type === 'info'
                        ? 'info'
                        : 'check'
                  }
                  size={12}
                  strokeWidth={2.6}
                />
              </span>
              <div>
                <div className="toast__title">{toast.title}</div>
                {toast.text && <div className="toast__text">{toast.text}</div>}
              </div>
              <button type="button" className="toast__close" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

/* --------------------------------------------------------------------------
   Misc
   -------------------------------------------------------------------------- */
export function InfoBanner({ children, tone = 'blue', icon = 'info' }) {
  return (
    <div
      className={cn(
        'info-banner',
        tone === 'amber' && 'info-banner--amber',
        tone === 'green' && 'info-banner--green',
      )}
    >
      <Icon name={icon} size={16} className="info-banner__icon" />
      <div>{children}</div>
    </div>
  )
}

export function EmptyState({ icon = 'inbox', title, text, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <Icon name={icon} size={22} />
      </div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action && <div className="mt-16">{action}</div>}
    </div>
  )
}

export function SectionHead({ title, subtitle, action }) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
