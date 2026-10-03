import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, X, Check } from 'lucide-react';

interface BillingDatePickerPopoverProps {
  value: string; // 'YYYY-MM-DD' format or ''
  onChange: (dateStr: string) => void;
  onClear: () => void;
  label?: string;
  className?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const formatToLocalDateString = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDateButton = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  }
  return dateStr;
};

export const BillingDatePickerPopover: React.FC<BillingDatePickerPopoverProps> = ({
  value,
  onChange,
  onClear,
  label = 'Select Date:',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Today reference
  const todayStr = formatToLocalDateString(new Date());
  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatToLocalDateString(d);
  })();
  const firstOfMonthStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  })();

  // Draft date while popover is open
  const [draftDate, setDraftDate] = useState<string>(value || todayStr);

  // View state: Month & Year displayed in calendar
  const initialDateObj = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState<number>(
    isNaN(initialDateObj.getFullYear()) ? new Date().getFullYear() : initialDateObj.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    isNaN(initialDateObj.getMonth()) ? new Date().getMonth() : initialDateObj.getMonth()
  );

  // Quick month/year selector view toggle
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(true);

  // Synchronize draft and view when opening or value changes
  useEffect(() => {
    if (isOpen) {
      const activeStr = value || todayStr;
      setDraftDate(activeStr);
      const parsed = new Date(activeStr + 'T00:00:00');
      if (!isNaN(parsed.getTime())) {
        setViewYear(parsed.getFullYear());
        setViewMonth(parsed.getMonth());
      }
      setIsMonthPickerOpen(false);

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.right < 320) {
          setAlignRight(false);
        } else {
          setAlignRight(true);
        }
      }
    }
  }, [isOpen, value]);

  // Click outside and Escape handling
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  // Preset handlers
  const handleSelectPreset = (targetDateStr: string) => {
    setDraftDate(targetDateStr);
    const parts = targetDateStr.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      setViewYear(parts[0]);
      setViewMonth(parts[1] - 1);
    }
  };

  // Date selection
  const handleSelectDate = (dateStr: string, inCurrentMonth: boolean) => {
    setDraftDate(dateStr);
    if (!inCurrentMonth) {
      const parts = dateStr.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        setViewYear(parts[0]);
        setViewMonth(parts[1] - 1);
      }
    }
  };

  // Confirm selection
  const handleApply = () => {
    if (draftDate) {
      onChange(draftDate);
    }
    setIsOpen(false);
  };

  // Clear selection
  const handleClear = () => {
    setDraftDate('');
    onClear();
    setIsOpen(false);
  };

  // Quick double click to apply immediately
  const handleDateDoubleClick = (dateStr: string) => {
    setDraftDate(dateStr);
    onChange(dateStr);
    setIsOpen(false);
  };

  // Generate grid calendar dates (42 cells: previous, current, next month days)
  const calendarCells = (() => {
    const cells = [];
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonthYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const prevMonthNum = viewMonth === 0 ? 12 : viewMonth;
      const dateStr = `${prevMonthYear}-${String(prevMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === draftDate
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === draftDate
      });
    }

    // Next month leading days to complete 6 rows (42 cells)
    const remainingCount = 42 - cells.length;
    for (let d = 1; d <= remainingCount; d++) {
      const nextMonthYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      const nextMonthNum = viewMonth === 11 ? 1 : viewMonth + 2;
      const dateStr = `${nextMonthYear}-${String(nextMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === draftDate
      });
    }

    return cells;
  })();

  const displayDateText = value ? formatDisplayDateButton(value) : 'Pick Date';

  return (
    <div ref={containerRef} className={`relative inline-block z-30 ${className}`}>
      {/* Modern Pop-over Trigger Button */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          aria-expanded={isOpen}
          aria-label="Select Date"
          className={`group flex items-center gap-2 text-xs rounded-xl px-3 py-1.5 transition-all duration-200 cursor-pointer select-none border shadow-2xs ${
            isOpen
              ? 'bg-[#FAF8F5] border-[#C8B58D] text-[#1E1E1E] ring-2 ring-[#C8B58D]/25'
              : value
              ? 'bg-[#FAF8F5] hover:bg-[#F3EFE8] border-[#E5E0D8] hover:border-[#C8B58D]/70 text-[#1E1E1E]'
              : 'bg-stone-50 hover:bg-[#FAF8F5] border-stone-200 hover:border-stone-300 text-stone-700'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-[#C8B58D] shrink-0 transition-transform group-hover:scale-110" />
          <span className="text-[11px] font-semibold text-stone-500 whitespace-nowrap">
            {label}
          </span>
          <span
            className={`font-semibold tracking-tight ${
              value ? 'text-[#1E1E1E]' : 'text-stone-400 italic'
            }`}
          >
            {displayDateText}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#C8B58D]' : 'group-hover:text-stone-600'
            }`}
          />
        </button>

        {/* Clear Single Date Trigger Shortcut */}
        {value && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              handleClear();
            }}
            className="ml-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors p-1 rounded-lg cursor-pointer"
            title="Clear date filter"
            aria-label="Clear date filter"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Floating Pop-over Card */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Calendar date picker"
          style={{
            position: 'absolute',
            top: '100%',
            marginTop: '8px',
            zIndex: 60,
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
            backgroundColor: '#FAF8F5'
          }}
          className={`absolute top-full mt-2 z-[60] ${
            alignRight ? 'right-0' : 'left-0'
          } w-[316px] max-w-[calc(100vw-32px)] rounded-[16px] border border-[#E5E0D8] p-3.5 animate-in fade-in zoom-in-95 duration-150 origin-top select-none`}
        >
          {/* Quick Presets Bar (Inside Pop-over) */}
          <div className="pb-3 mb-3 border-b border-[#E5E0D8]/70">
            <div className="flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => handleSelectPreset(todayStr)}
                className={`flex-1 py-1 px-1.5 text-[11px] font-semibold rounded-full transition-all duration-150 text-center cursor-pointer ${
                  draftDate === todayStr
                    ? 'bg-[#1A1A1A] text-white shadow-xs'
                    : 'bg-[#F0EDE6]/80 hover:bg-[#E5E0D8] text-[#1E1E1E]'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset(yesterdayStr)}
                className={`flex-1 py-1 px-1.5 text-[11px] font-semibold rounded-full transition-all duration-150 text-center cursor-pointer ${
                  draftDate === yesterdayStr
                    ? 'bg-[#1A1A1A] text-white shadow-xs'
                    : 'bg-[#F0EDE6]/80 hover:bg-[#E5E0D8] text-[#1E1E1E]'
                }`}
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset(firstOfMonthStr)}
                className={`flex-1 py-1 px-1.5 text-[11px] font-semibold rounded-full transition-all duration-150 text-center cursor-pointer ${
                  draftDate === firstOfMonthStr
                    ? 'bg-[#1A1A1A] text-white shadow-xs'
                    : 'bg-[#F0EDE6]/80 hover:bg-[#E5E0D8] text-[#1E1E1E]'
                }`}
              >
                First of Month
              </button>
            </div>
          </div>

          {/* Calendar Header & Month Navigation */}
          <div className="flex items-center justify-between px-1 mb-2.5">
            {/* Month/Year Title with subtle dropdown chevron */}
            <button
              type="button"
              onClick={() => setIsMonthPickerOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-2 py-1 -ml-1 rounded-lg hover:bg-[#F0EDE6] transition-colors cursor-pointer group text-left"
              title="Toggle month/year browser"
            >
              <span className="text-sm font-bold text-[#1E1E1E] tracking-tight">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-stone-500 transition-transform duration-200 ${
                  isMonthPickerOpen ? 'rotate-180 text-[#C8B58D]' : 'group-hover:text-[#1E1E1E]'
                }`}
              />
            </button>

            {/* Navigation Arrows in circular soft-grey buttons with hover scale */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="w-7 h-7 rounded-full bg-[#F0EDE6]/90 hover:bg-[#E5E0D8] active:bg-[#DCD6CC] text-[#1E1E1E] flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="w-7 h-7 rounded-full bg-[#F0EDE6]/90 hover:bg-[#E5E0D8] active:bg-[#DCD6CC] text-[#1E1E1E] flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Month / Year Picker Drawer */}
          {isMonthPickerOpen ? (
            <div className="py-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between px-2 mb-2 pb-2 border-b border-[#E5E0D8]">
                <span className="text-xs font-bold text-stone-600">Select Month ({viewYear})</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setViewYear(y => y - 1)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-[#F0EDE6] hover:bg-[#E5E0D8] font-bold text-stone-700"
                  >
                    {viewYear - 1}
                  </button>
                  <span className="text-xs font-black text-[#1E1E1E] px-1">{viewYear}</span>
                  <button
                    type="button"
                    onClick={() => setViewYear(y => y + 1)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-[#F0EDE6] hover:bg-[#E5E0D8] font-bold text-stone-700"
                  >
                    {viewYear + 1}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 py-1">
                {MONTH_NAMES.map((name, idx) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setViewMonth(idx);
                      setIsMonthPickerOpen(false);
                    }}
                    className={`py-1.5 text-xs rounded-xl font-medium transition-all cursor-pointer ${
                      viewMonth === idx
                        ? 'bg-[#1A1A1A] text-white font-bold shadow-xs'
                        : 'bg-[#F0EDE6]/60 hover:bg-[#F0EDE6] text-[#1E1E1E]'
                    }`}
                  >
                    {name.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Day Headers (S, M, T, W, T, F, S) */}
              <div className="grid grid-cols-7 mb-1.5">
                {DAY_LABELS.map((dayLabel, index) => (
                  <div
                    key={`${dayLabel}-${index}`}
                    className="text-center font-bold text-[11px] tracking-[0.05em] text-[#8C857B] select-none py-0.5"
                  >
                    {dayLabel}
                  </div>
                ))}
              </div>

              {/* Grid Layout & 36px x 36px Date Nodes */}
              <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 place-items-center">
                {calendarCells.map((cell, idx) => {
                  const isSelected = cell.isSelected;
                  const isToday = cell.isToday;
                  const inCurrentMonth = cell.isCurrentMonth;

                  return (
                    <button
                      key={`${cell.dateStr}-${idx}`}
                      type="button"
                      onClick={() => handleSelectDate(cell.dateStr, inCurrentMonth)}
                      onDoubleClick={() => handleDateDoubleClick(cell.dateStr)}
                      className={`relative w-[36px] h-[36px] flex flex-col items-center justify-center rounded-full text-xs font-medium transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-[#1A1A1A] text-white font-bold scale-105 shadow-[0_2px_10px_rgba(26,26,26,0.35)] z-10'
                          : inCurrentMonth
                          ? 'text-[#1E1E1E] hover:bg-[#F0EDE6] hover:text-[#1E1E1E]'
                          : 'text-[#8C857B]/60 hover:text-[#1E1E1E] hover:bg-[#F0EDE6]/60'
                      }`}
                    >
                      <span className="leading-none">{cell.dayNumber}</span>

                      {/* Current Date Indicator: Subtle dot indicator beneath today's node */}
                      {isToday && (
                        <span
                          className={`absolute bottom-1 w-1 h-1 rounded-full ${
                            isSelected ? 'bg-[#C8B58D]' : 'bg-[#C8B58D]'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Footer & Action Buttons */}
          <div className="mt-3 pt-3 border-t border-[#E5E0D8] flex items-center justify-between">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 hover:bg-[#F0EDE6] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Clear
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-stone-400 font-medium hidden sm:inline">
                {draftDate ? formatDisplayDateButton(draftDate) : 'No date'}
              </span>
              <button
                type="button"
                onClick={handleApply}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#1A1A1A] hover:bg-[#2B2823] rounded-full shadow-sm hover:shadow transition-all duration-150 active:scale-95 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-[#C8B58D]" />
                <span>Apply Date</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
