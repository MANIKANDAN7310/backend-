import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import './DatePicker.css';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const parseAnyDate = (str) => {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (!trimmed) return null;

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) return parsed;

  const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const [, y, m, day] = ymdMatch;
    const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(day, 10));
    if (!isNaN(d.getTime())) return d;
  }

  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const [, day, m, y] = dmyMatch;
    const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(day, 10));
    if (!isNaN(d.getTime())) return d;
  }

  return null;
};

export const formatDisplayDate = (dateObj) => {
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const month = MONTH_NAMES[dateObj.getMonth()];
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  return `${month} ${day}, ${year}`;
};

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const DatePicker = ({
  name,
  value = '',
  onChange,
  placeholder = 'Select date',
  align = 'left',
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedDate = useMemo(() => parseAnyDate(value), [value]);

  // View state for month/year navigation in the calendar
  const [viewDate, setViewDate] = useState(() => {
    return selectedDate || new Date();
  });

  // Keep viewDate synchronized when selected date changes externally
  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  // Handle clicking outside or pressing Escape to close popup
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleMonthSelect = (e) => {
    e.stopPropagation();
    const newMonth = parseInt(e.target.value, 10);
    setViewDate(new Date(viewYear, newMonth, 1));
  };

  const handleYearSelect = (e) => {
    e.stopPropagation();
    const newYear = parseInt(e.target.value, 10);
    setViewDate(new Date(newYear, viewMonth, 1));
  };

  const handleSelectDay = (dayObj) => {
    const formatted = formatDisplayDate(dayObj);
    if (onChange) {
      onChange({ target: { name, value: formatted } });
    }
    setIsOpen(false);
  };

  const handlePreset = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const formatted = formatDisplayDate(d);
    if (onChange) {
      onChange({ target: { name, value: formatted } });
    }
    setViewDate(d);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange({ target: { name, value: '' } });
    }
  };

  const handleInputChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  // Calendar days grid calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(viewYear, viewMonth - 1, daysInPrevMonth - i);
      days.push({
        date: prevDate,
        dayNum: daysInPrevMonth - i,
        isCurrentMonth: false,
        isSelected: isSameDay(prevDate, selectedDate),
        isToday: isSameDay(prevDate, new Date())
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const curDate = new Date(viewYear, viewMonth, i);
      days.push({
        date: curDate,
        dayNum: i,
        isCurrentMonth: true,
        isSelected: isSameDay(curDate, selectedDate),
        isToday: isSameDay(curDate, new Date())
      });
    }

    // Next month padding days to complete row
    const remainingSlots = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingSlots; i++) {
      const nextDate = new Date(viewYear, viewMonth + 1, i);
      days.push({
        date: nextDate,
        dayNum: i,
        isCurrentMonth: false,
        isSelected: isSameDay(nextDate, selectedDate),
        isToday: isSameDay(nextDate, new Date())
      });
    }

    return days;
  }, [viewYear, viewMonth, selectedDate]);

  // Year choices
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear - 6; y <= currentYear + 10; y++) {
    yearOptions.push(y);
  }

  return (
    <div 
      className={`custom-datepicker-container ${className}`} 
      ref={containerRef}
    >
      <div 
        className={`custom-datepicker-input-wrapper ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
      >
        <input
          type="text"
          className="form-input custom-datepicker-input"
          name={name}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
        />
        
        <div className="custom-datepicker-actions">
          {value && !disabled && (
            <button
              type="button"
              className="custom-datepicker-clear-btn"
              onClick={handleClear}
              title="Clear date"
            >
              <X size={13} />
            </button>
          )}
          <span 
            className="custom-datepicker-calendar-icon"
            title="Open calendar"
          >
            <Calendar size={16} />
          </span>
        </div>
      </div>

      {isOpen && (
        <div className={`custom-datepicker-popover align-${align}`}>
          {/* Header with Month/Year Navigation */}
          <div className="custom-datepicker-header">
            <button 
              type="button" 
              className="custom-datepicker-nav-btn"
              onClick={handlePrevMonth}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="custom-datepicker-selectors">
              <select 
                className="custom-datepicker-select" 
                value={viewMonth}
                onChange={handleMonthSelect}
                onClick={(e) => e.stopPropagation()}
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              <select 
                className="custom-datepicker-select" 
                value={viewYear}
                onChange={handleYearSelect}
                onClick={(e) => e.stopPropagation()}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button 
              type="button" 
              className="custom-datepicker-nav-btn"
              onClick={handleNextMonth}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick Presets for Invoicing */}
          <div className="custom-datepicker-presets">
            <button 
              type="button" 
              className="preset-chip"
              onClick={(e) => { e.stopPropagation(); handlePreset(0); }}
            >
              Today
            </button>
            <button 
              type="button" 
              className="preset-chip"
              onClick={(e) => { e.stopPropagation(); handlePreset(7); }}
            >
              +7d
            </button>
            <button 
              type="button" 
              className="preset-chip"
              onClick={(e) => { e.stopPropagation(); handlePreset(14); }}
            >
              +14d
            </button>
            <button 
              type="button" 
              className="preset-chip"
              onClick={(e) => { e.stopPropagation(); handlePreset(30); }}
            >
              +30d
            </button>
          </div>

          {/* Weekday headers */}
          <div className="custom-datepicker-weekdays">
            {WEEKDAY_NAMES.map((day) => (
              <span key={day} className="weekday-label">{day}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="custom-datepicker-days-grid">
            {calendarDays.map((item, index) => {
              const dayClass = [
                'calendar-day-btn',
                item.isCurrentMonth ? 'current-month' : 'other-month',
                item.isSelected ? 'selected' : '',
                item.isToday ? 'today' : ''
              ].filter(Boolean).join(' ');

              return (
                <button
                  type="button"
                  key={index}
                  className={dayClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectDay(item.date);
                  }}
                >
                  <span className="day-number">{item.dayNum}</span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="custom-datepicker-footer">
            <button
              type="button"
              className="datepicker-footer-btn clear"
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              type="button"
              className="datepicker-footer-btn close"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
